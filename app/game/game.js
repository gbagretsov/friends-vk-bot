const needle = require('needle');
const fs = require('fs');
require('dotenv').config();

const vk = require('../vk');
const dbClient = require('../db');
const admin = require('./admin');

const TABLE_STATE = 'state';
const TABLE_WORDS = 'words';

const STATE_IDLE = 'idle';
const STATE_PLAYING = 'playing';

const STEP_INTERVAL = process.env.GAME_STEP_INTERVAL || 15000;

let message, answer;
let timeoutObj;

function getRandomTask() {
  // TODO: поддержка категорий
  let tableName = TABLE_WORDS;
  let category = 'слово';

  let query = `
    SELECT name FROM friends_vk_bot.${tableName}
    ORDER BY RANDOM() LIMIT 1;
  `;

  let toReturn;
  let client = dbClient();

  return client.query(query)
    .then(result => {
      toReturn = {
        category: category,
        answer: result.rows[0].name,
      };
      return client.end();
    })
    .then(result => {
      return toReturn;
    });
}

function setGameState(state) {
  let query = `
    BEGIN TRANSACTION;
    UPDATE friends_vk_bot.state SET value = '${ state.state }' WHERE key = 'state';
    UPDATE friends_vk_bot.state SET value = '${ state.answer }' WHERE key = 'answer';
    COMMIT TRANSACTION;
  `;
  let client = dbClient();
  return client.query(query)
    .then(() => client.end());
}

function getGameState() {
  let state = {};
  let client = dbClient();
  return client.query('SELECT * FROM friends_vk_bot.state;')
    .then(result => {
      for (let row of result.rows) {
        state[row['key']] = row['value'];
      }
      return client.end();
    })
    .then(() => state);
}

function handleMessage(resolve, reject) {
  getGameState()
    .then(state => {
      if (handleAddWordRequest() || handleDeleteWordRequest()) {
        resolve(true);
      } else if (state.state === STATE_IDLE) {
        handleIdleState(resolve, reject);
      } else if (state.state === STATE_PLAYING) {
        answer = state.answer;
        handlePlayingState(resolve, reject);
      }
    });
}

function handleAddWordRequest() {
  let text = this.message.text.toLowerCase();
  let botMentioned = text.startsWith('бот,') || text.includes('club171869330');
  let isAddWordRequest = text.includes('запомни слово');

  if (botMentioned && isAddWordRequest) {
    let word = extractWord(text);

    if (word) {
      admin.addWord(word)
        .then(result => {
          if (result == 23505) {
            vk.sendMessage(`Я уже знаю слово "${ word }"! 😊`, 3000);
          } else {
            vk.sendMessage(`👍 Я запомнил слово "${ word }"!`, 3000);
          }
        });
    } else {
      vk.getUserName(this.message.from_id)
        .then(name => vk.sendMessage(`${name}, я тебя не понимаю 😒`, 3000));
    }
    return true;
  }

  return false;
}

function handleDeleteWordRequest() {
  let text = this.message.text.toLowerCase();
  let botMentioned = text.startsWith('бот,') || text.includes('club171869330');
  let isDeleteWordRequest = text.includes('забудь слово');

  if (botMentioned && isDeleteWordRequest) {
    let word = extractWord(text);
    
    if (word) {
      admin.deleteWord(word)
        .then(() => vk.sendMessage(`👍 Я забыл слово "${ word }"!`, 3000));
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

  word = word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()a-zA-Z\d]/g, '');

  return word === '' ? false : word;
}

function handleIdleState(resolve, reject) {
  let text = this.message.text.toLowerCase();
  let category;

  if (isGameRequestMessage(text)) {
    resolve(true);
    getRandomTask()
      .then(task => {
        answer = task.answer;
        category = task.category;
        return generatePhotos();
      })
      .then(result => {
        console.log(answer);
        setGameState({state: STATE_PLAYING, answer: answer});
        timeoutObj = setTimeout(giveHint, STEP_INTERVAL);
        
        // TODO: больше приветственных сообщений
        let welcomeMessages = [
          `Игра начинается, отгадывать могут все! 😏 Какое слово я загадал?`,
          `Я люблю играть! 😊 Я загадал слово, которое описывает эту картинку. Сможете угадать это слово?`,
        ];

        return vk.sendMessage(welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)], 3000);
      })
      .then(response => {
        let photoPath = __dirname + '/task.jpg';
        return vk.sendPhoto(photoPath);
      })
      .catch(error => {
        // Бот устал
        if (error.message === 'usageLimits') {
          // TODO: больше сообщений
          let limitsMessages = [
            `Что-то я устал играть... 😫 Приходите завтра 😊`,
            `Давай продолжим завтра? Сегодня больше не хочется 😳`,
            `Я уже наигрался, мне надо отдохнуть`,
          ];

          let limitsStickers = [ 13, 85, 2091, 5135, 5629 ];

          return vk.sendSticker(limitsStickers[Math.floor(Math.random() * limitsStickers.length)])
            .then(response => {
              return vk.sendMessage(limitsMessages[Math.floor(Math.random() * limitsMessages.length)], 5000);
            });
        };
      });
  } else {
    resolve(false);
  }
}

function generatePhotos() {
  let apiURL = 'https://www.googleapis.com/customsearch/v1';
  let key = process.env.GOOGLE_KEY;
  let cx = process.env.GOOGLE_SEARCH_ENGINE_ID;
  let start = randomInteger(1, 5);
  let hintImgURL;

  let url = `${apiURL}?q=${encodeURIComponent(answer)}&cx=${cx}&fileType=jpg&num=2&safe=active&searchType=image&fields=items%2Flink&start=${start}&key=${key}`;
  return needle('get', url)
    .then(response => {
      console.log(response.body);
      if (response.body.error && response.body.error.errors[0].domain === 'usageLimits') {
        throw new Error('usageLimits');
      }
      let taskImgURL = response.body.items[0].link;
      hintImgURL = response.body.items[1].link;
      return needle('get', taskImgURL);
    })
    .then(response => {
      fs.writeFileSync(__dirname + '/task.jpg', response.body);
      return needle('get', hintImgURL);
    })
    .then(response => {
      fs.writeFileSync(__dirname + '/hint.jpg', response.body);
    });
}

function randomInteger(min, max) {
  let rand = min + Math.random() * (max + 1 - min);
  rand = Math.floor(rand);
  return rand;
}

function giveHint() {
  timeoutObj = setTimeout(sendAnswer, STEP_INTERVAL);
  
  // TODO: больше сообщений подсказок
  let hintMessages = [
    'Никто не знает? 😒 Вот подсказка!',
    'Я не думал, что будет так сложно... 😥 Держите подсказку',
  ];

  photoPath = __dirname + '/hint.jpg';

  vk.sendMessage(hintMessages[Math.floor(Math.random() * hintMessages.length)])
  .then(response => {
    return vk.sendPhoto(photoPath);
  });
}

function sendAnswer() {
  setGameState({state: STATE_IDLE, answer: ''});

  // TODO: больше сообщений ответов
  let answerMessages = [
    `Не разгадали? Это же ${answer}!`,
    `⏱ Время истекло! Правильный ответ — ${answer}`,
  ];

  vk.sendMessage(answerMessages[Math.floor(Math.random() * answerMessages.length)]);
}

function handlePlayingState(resolve, reject) {
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
    setGameState({state: STATE_IDLE, answer: ''});
    vk.getUserName(this.message.from_id)
      .then(function (name) {
        let successMessages = [
          `Браво, ${name}! Моё слово — ${answer} 👏`,
          `${name}, ты умница! 😃 На картинке ${answer}`,
          `Правильно, ${name}! 👍 Это действительно ${answer}`,
          `И в этом раунде побеждает ${name}, разгадав слово "${answer}"! 😎`,
          `Я увидел правильный ответ — ${answer}! ${name}, как тебе это удаётся? 🙀`,
        ];
        let successMessage = successMessages[Math.floor(Math.random() * successMessages.length)];
        return vk.sendMessage(successMessage);
      })
      .then(response => {
        let photoPath = __dirname + '/full.jpg';
        return vk.sendPhoto(photoPath);
      });
    // TODO: отправлять стикер
  }
  resolve(answerIsCorrect);
}

function isGameRequestMessage(text) {
  text = text.toLowerCase();
  let botMentioned = text.startsWith('бот,') || text.includes('club171869330');
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
}