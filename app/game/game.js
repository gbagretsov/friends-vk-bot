const needle = require('needle');
const fs = require('fs');
require('dotenv').config();

const vk = require('../vk');
const dbClient = require('../db');
const admin = require('./admin');

const TABLE_WORDS = 'words';

const STATE_IDLE = 'idle';
const STATE_PLAYING = 'playing';

const STEP_INTERVAL = process.env.GAME_STEP_INTERVAL || 15000;

let answer;
let timeoutObj;

async function getRandomTask() {
  // TODO: поддержка категорий
  let query = `
    SELECT name FROM friends_vk_bot.${TABLE_WORDS} WHERE approved = true
    ORDER BY RANDOM() LIMIT 1;
  `;

  let client = dbClient();

  const dbResult = await client.query(query);
  await client.end();
  return {
    answer: dbResult.rows[0].name,
  };
}

async function setGameState(state) {
  let query = `
    BEGIN TRANSACTION;
    UPDATE friends_vk_bot.state SET value = '${ state.state }' WHERE key = 'state';
    UPDATE friends_vk_bot.state SET value = '${ state.answer }' WHERE key = 'answer';
    COMMIT TRANSACTION;
  `;
  let client = dbClient();
  await client.query(query);
  await client.end();
}

async function getGameState() {
  let state = {};
  let client = dbClient();
  const dbResult = await client.query('SELECT * FROM friends_vk_bot.state;');
  await client.end();
  for (let row of dbResult.rows) {
    state[row['key']] = row['value'];
  }
  return state;
}

async function handleMessage(resolve, reject) {
  const state = await getGameState();
  if (await handleAddWordRequest() || await handleDeleteWordRequest()) {
    resolve(true);
  } else if (state.state === STATE_IDLE) {
    await handleIdleState(resolve, reject);
  } else if (state.state === STATE_PLAYING) {
    answer = state.answer;
    await handlePlayingState(resolve, reject);
  }
}

async function handleAddWordRequest() {
  let text = this.message.text.toLowerCase();
  let botMentioned = isBotMentioned(text);
  let isAddWordRequest = text.includes('запомни слово');

  if (botMentioned && isAddWordRequest) {
    let word = extractWord(text);

    if (word) {
      const result = await admin.addWord(word);
      if (result === '23505') {
        vk.sendMessage(`Я уже знаю слово "${ word }"! 😊`, 3000);
      } else {
        vk.sendMessage(`👍 Я запомнил слово "${ word }"!`, 3000);
      }
    } else {
      vk.getUserName(this.message.from_id)
        .then(name => vk.sendMessage(`${name}, я тебя не понимаю 😒`, 3000));
    }
    return true;
  }

  return false;
}

async function handleDeleteWordRequest() {
  let text = this.message.text.toLowerCase();
  let botMentioned = isBotMentioned(text);
  let isDeleteWordRequest = text.includes('забудь слово');

  if (botMentioned && isDeleteWordRequest) {
    let word = extractWord(text);
    
    if (word) {
      await admin.deleteWord(word);
      vk.sendMessage(`👍 Я забыл слово "${ word }"!`, 3000);
    } else {
      vk.getUserName(this.message.from_id)
        .then(name => vk.sendMessage(`${name}, я тебя не понимаю 😒`, 3000));
    }
    return true;
  }

  return false;
}

function extractWord(text) {
  let parts = text.split(' ');
  let word = parts[parts.length - 1];

  word = word.replace(/[.,/#!$%^&*;:{}=\-_`~()a-zA-Z\d]/g, '');

  return word === '' ? false : word;
}

async function handleIdleState(resolve) {
  let text = this.message.text.toLowerCase();

  if (isGameRequestMessage(text)) {
    resolve(true);
    const task = await getRandomTask();
    answer = task.answer;
    try {
      await generatePhotos();
      console.log(answer);
      await setGameState({state: STATE_PLAYING, answer: answer});
      // TODO: больше приветственных сообщений
      let welcomeMessages = [
        'Игра начинается, отгадывать могут все! 😏 Какое слово я загадал?',
        'Я люблю играть! 😊 Я загадал слово, которое описывает эту картинку. Сможете угадать это слово?',
      ];
      await vk.sendMessage(welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)], 3000);
      let photoPath = __dirname + '/task.jpg';
      await vk.sendPhoto(photoPath);
      timeoutObj = setTimeout(giveHint, STEP_INTERVAL);
    } catch (error) {
      // Бот устал
      if (error.message === 'usageLimits') {
        // TODO: больше сообщений
        let limitsMessages = [
          'Что-то я устал играть... 😫 Приходите завтра 😊',
          'Давай продолжим завтра? Сегодня больше не хочется 😳',
          'Я уже наигрался, мне надо отдохнуть',
        ];

        let limitsStickers = [13, 85, 2091, 5135, 5629];

        await vk.sendSticker(limitsStickers[Math.floor(Math.random() * limitsStickers.length)]);
        await vk.sendMessage(limitsMessages[Math.floor(Math.random() * limitsMessages.length)], 5000);
      }
    }
  } else {
    resolve(false);
  }
}

async function generatePhotos() {
  let apiURL = 'https://www.googleapis.com/customsearch/v1';
  let key = process.env.GOOGLE_KEY;
  let cx = process.env.GOOGLE_SEARCH_ENGINE_ID;
  let start = randomInteger(1, 5);

  let url = `${apiURL}?q=${encodeURIComponent(answer)}&cx=${cx}&fileType=jpg&num=2&safe=active&searchType=image&fields=items%2Flink&start=${start}&key=${key}`;
  const googleResponse = await needle('get', url);
  console.log(googleResponse.body);
  if (googleResponse.body.error && googleResponse.body.error.errors[0].domain === 'usageLimits') {
    throw new Error('usageLimits');
  }
  const taskImgURL = googleResponse.body.items[0].link;
  const hintImgURL = googleResponse.body.items[1].link;
  const taskImgResponse = await needle('get', taskImgURL);
  const hintImgResponse = await needle('get', hintImgURL);
  fs.writeFileSync(__dirname + '/task.jpg', taskImgResponse.body);
  fs.writeFileSync(__dirname + '/hint.jpg', hintImgResponse.body);
}

function randomInteger(min, max) {
  let rand = min + Math.random() * (max + 1 - min);
  rand = Math.floor(rand);
  return rand;
}

async function giveHint() {

  // TODO: больше сообщений подсказок
  let hintMessages = [
    'Никто не знает? 😒 Вот подсказка!',
    'Я не думал, что будет так сложно... 😥 Держите подсказку',
  ];

  const photoPath = __dirname + '/hint.jpg';

  await vk.sendMessage(hintMessages[Math.floor(Math.random() * hintMessages.length)]);
  await vk.sendPhoto(photoPath);

  timeoutObj = setTimeout(sendAnswer, STEP_INTERVAL);
}

async function sendAnswer() {
  await setGameState({state: STATE_IDLE, answer: ''});

  // TODO: больше сообщений ответов
  let answerMessages = [
    `Не разгадали? Это же ${answer}!`,
    `⏱ Время истекло! Правильный ответ — ${answer}`,
  ];

  vk.sendMessage(answerMessages[Math.floor(Math.random() * answerMessages.length)]);
}

async function handlePlayingState(resolve) {
  let text = this.message.text.toLowerCase();

  // Если игра уже идёт, но кто-то написал новый запрос на игру,
  // нужно закончить обработку этого сообщения, чтобы не было наложений сценариев бота
  if(isGameRequestMessage(text)) {
    console.log('game is already running');
    resolve(true);
    return;
  }

  let answerIsCorrect = checkAnswer(text);

  if (answerIsCorrect) {
    clearTimeout(timeoutObj);
    resolve(true);
    await setGameState({state: STATE_IDLE, answer: ''});
    const name = await vk.getUserName(this.message.from_id);
    let successMessages = [
      `Браво, ${name}! Моё слово — ${answer} 👏`,
      `${name}, ты умница! 😃 На картинке ${answer}`,
      `Правильно, ${name}! 👍 Это действительно ${answer}`,
      `И в этом раунде побеждает ${name}, разгадав слово "${answer}"! 😎`,
      `Я увидел правильный ответ — ${answer}! ${name}, как тебе это удаётся? 🙀`,
    ];
    let successMessage = successMessages[Math.floor(Math.random() * successMessages.length)];
    vk.sendMessage(successMessage);
    // TODO: отправлять стикер
  } else {
    let word = extractWord(text);
    let botMentioned = isBotMentioned(text);
    resolve(word && !botMentioned);
    if (word && !botMentioned) {
      await admin.addWord(word, false);
    }
  }
}

function isBotMentioned(text) {
  return text.startsWith('бот,') || text.includes('club171869330');
}

function isGameRequestMessage(text) {
  text = text.toLowerCase();
  let botMentioned = isBotMentioned(text);
  let gameRequested = 
    text.includes(' игр') ||
    text.includes('поигра') || 
    text.includes('сыгра');
  return botMentioned && gameRequested;
}

function checkAnswer(entered) {
  // TODO: более щадящая и интеллектуальная проверка корректности ответа
  return entered === answer.toLowerCase();
}

module.exports = function(message) {
  this.message = message;
  return new Promise(handleMessage);
};
