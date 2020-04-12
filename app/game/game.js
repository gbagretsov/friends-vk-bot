const needle = require('needle');
const fs = require('fs');
require('dotenv').config();
const uuid = require('uuid');

const vk = require('../vk');
const dbClient = require('../db');
const admin = require('./admin');

const TABLE_WORDS = 'words';

const STEP_INTERVAL = process.env.GAME_STEP_INTERVAL || 15000;

let message = null;
let answer = '';
let isPlaying = false;
let gameId = '';
let timeoutObj = null;

async function getRandomTask() {
  // TODO: поддержка категорий
  let query = `
    SELECT name FROM friends_vk_bot.${TABLE_WORDS} WHERE approved = true
    ORDER BY RANDOM() LIMIT 1;
  `;

  const dbResult = await dbClient.query(query);
  return {
    answer: dbResult.rows[0].name,
  };
}

function handleMessage() {
  if (!message.text) {
    return false;
  }
  if (isAddWordRequest(message.text)) {
    handleAddWordRequest(message.text);
    return true;
  }
  if (isDeleteWordRequest(message.text)) {
    handleDeleteWordRequest(message.text);
    return true;
  }
  if (isPlaying) {
    return handlePlayingState();
  }
  if (isGameRequestMessage(message.text)) {
    handleGameRequestMessage(message.text);
    return true;
  }
  return false;
}

function isAddWordRequest(text) {
  const botMentioned = isBotMentioned(text);
  const containsAddWordRequest = text.includes('запомни слово');
  return botMentioned && containsAddWordRequest;
}

async function handleAddWordRequest(text) {
  if (isAddWordRequest(text)) {
    let word = extractWord(text);

    if (word) {
      const result = await admin.addWord(word);
      if (result === '23505') {
        vk.sendMessage(`Я уже знаю слово "${ word }"! 😊`, 3000);
      } else {
        vk.sendMessage(`👍 Я запомнил слово "${ word }"!`, 3000);
      }
    } else {
      vk.getUserName(message.from_id)
        .then(name => vk.sendMessage(`${name}, я тебя не понимаю 😒`, 3000));
    }
  }
}

function isDeleteWordRequest(text) {
  const botMentioned = isBotMentioned(text);
  const containsDeleteWordRequest = text.includes('забудь слово');
  return botMentioned && containsDeleteWordRequest;
}

async function handleDeleteWordRequest(text) {
  if (isDeleteWordRequest(text)) {
    let word = extractWord(text);
    
    if (word) {
      await admin.deleteWord(word);
      vk.sendMessage(`👍 Я забыл слово "${ word }"!`, 3000);
    } else {
      vk.getUserName(message.from_id)
        .then(name => vk.sendMessage(`${name}, я тебя не понимаю 😒`, 3000));
    }
  }
}

function extractWord(text) {
  let parts = text.split(' ');
  let word = parts[parts.length - 1];

  word = word.replace(/[.,/#!$%^&*;:{}=\-_`~()a-zA-Z\d]/g, '');

  return word === '' ? false : word;
}

async function handleGameRequestMessage(text) {

  if (isGameRequestMessage(text)) {
    isPlaying = true;
    gameId = uuid.v4();
    const task = await getRandomTask();
    try {
      await generatePhotos(task.answer);
      // TODO: больше приветственных сообщений
      let welcomeMessages = [
        'Игра начинается, отгадывать могут все! 😏 Какое слово я загадал?',
        'Я люблю играть! 😊 Я загадал слово, которое описывает эту картинку. Сможете угадать это слово?',
      ];
      await vk.sendMessage(welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)], 3000);
      let photoPath = __dirname + '/task.jpg';
      await vk.sendPhoto(photoPath);
      answer = task.answer;
      console.log(`Correct answer: ${answer}`);
      timeoutObj = setTimeout(() => giveHint(gameId), STEP_INTERVAL);
    } catch (error) {
      resetGame();
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
  }
}

async function generatePhotos(answer) {
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
  const redirectOptions = { follow_max: 2 };
  const taskImgResponse = await needle('get', taskImgURL, null, redirectOptions);
  const hintImgResponse = await needle('get', hintImgURL, null, redirectOptions);
  fs.writeFileSync(__dirname + '/task.jpg', taskImgResponse.body);
  fs.writeFileSync(__dirname + '/hint.jpg', hintImgResponse.body);
}

function randomInteger(min, max) {
  let rand = min + Math.random() * (max + 1 - min);
  rand = Math.floor(rand);
  return rand;
}

async function giveHint(previousGameId) {

  // TODO: больше сообщений подсказок
  let hintMessages = [
    'Никто не знает? 😒 Вот подсказка!',
    'Я не думал, что будет так сложно... 😥 Держите подсказку',
  ];

  const photoPath = __dirname + '/hint.jpg';

  await vk.sendMessage(hintMessages[Math.floor(Math.random() * hintMessages.length)]);
  await vk.sendPhoto(photoPath);

  if (previousGameId === gameId) {
    timeoutObj = setTimeout(() => handleGameLoss(previousGameId), STEP_INTERVAL);
  } else {
    console.log('previous game is over, no need to handle game loss');
  }
}

async function handleGameLoss(previousGameId) {
  if (previousGameId !== gameId) {
    return;
  }
  // TODO: больше сообщений ответов
  let answerMessages = [
    `Не разгадали? Это же ${answer}!`,
    `⏱ Время истекло! Правильный ответ — ${answer}`,
  ];

  resetGame();

  vk.sendMessage(answerMessages[Math.floor(Math.random() * answerMessages.length)]);
}

function resetGame() {
  isPlaying = false;
  answer = '';
  gameId = '';
}

async function handleCorrectAnswer() {
  clearTimeout(timeoutObj);
  const previousAnswer = answer;
  resetGame();
  const name = await vk.getUserName(message.from_id);
  let successMessages = [
    `Браво, ${name}! Моё слово — ${previousAnswer} 👏`,
    `${name}, ты умница! 😃 На картинке ${previousAnswer}`,
    `Правильно, ${name}! 👍 Это действительно ${previousAnswer}`,
    `И в этом раунде побеждает ${name}, разгадав слово "${previousAnswer}"! 😎`,
    `Я увидел правильный ответ — ${previousAnswer}! ${name}, как тебе это удаётся? 🙀`,
  ];
  let successMessage = successMessages[Math.floor(Math.random() * successMessages.length)];
  vk.sendMessage(successMessage);
  // TODO: отправлять стикер
}

function handlePlayingState() {
  let text = message.text.toLowerCase();

  // Если игра уже идёт, но кто-то написал новый запрос на игру,
  // нужно закончить обработку этого сообщения, чтобы не было наложений сценариев бота
  if(isGameRequestMessage(text)) {
    console.log('game is already running');
    return true;
  }

  let answerIsCorrect = checkAnswer(text);

  if (answerIsCorrect) {
    handleCorrectAnswer();
    return true;
  } else {
    let word = extractWord(text);
    let botMentioned = isBotMentioned(text);
    if (word && !botMentioned) {
      admin.addWord(word, false);
    }
    return word && !botMentioned;
  }
}

function isBotMentioned(text) {
  return text.toLowerCase().startsWith('бот,') || text.includes(`club${process.env.VK_GROUP_ID}`);
}

function isGameRequestMessage(text) {
  const _text = text.toLowerCase();
  let botMentioned = isBotMentioned(_text);
  let gameRequested = 
    _text.includes(' игр') ||
    _text.includes('поигра') ||
    _text.includes('сыгра');
  return botMentioned && gameRequested;
}

function checkAnswer(entered) {
  // TODO: более щадящая и интеллектуальная проверка корректности ответа
  return entered === answer.toLowerCase();
}

module.exports = function(_message) {
  message = _message;
  return handleMessage();
};
