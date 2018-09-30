const vk = require('../vk');
const dbClient = require('../db');

const TABLE_STATE = 'state';
const TABLE_ACTORS = 'actors';

const STATE_IDLE = 'idle';
const STATE_PLAYING = 'playing';

const STEP_INTERVAL = 15000;

let message, answer;
let timeoutObj;

function getRandomTask() {
  // TODO: поддержка других категорий
  let tableName = TABLE_ACTORS;
  let category = 'актёр или актриса';

  let query = `
    SELECT name FROM friends_vk_bot.${tableName}
    ORDER BY RANDOM() LIMIT 1;
  `;

  return dbClient().query(query)
    .then(result => {
      return {
        category: category,
        answer: result.rows[0].name,
      };
    });
}

function setGameState(state) {
  let query = `
    BEGIN TRANSACTION;
    UPDATE friends_vk_bot.state SET value = '${ state.state }' WHERE key = 'state';
    UPDATE friends_vk_bot.state SET value = '${ state.answer }' WHERE key = 'answer';
    COMMIT TRANSACTION;
  `;
  return dbClient().query(query);
}

function getGameState() {
  return dbClient().query('SELECT * FROM friends_vk_bot.state;')
    .then(result => {
      state = {};
      for (let row of result.rows) {
        state[row['key']] = row['value'];
      }
      return state;
    });
}

function handleMessage(resolve, reject) {
  getGameState()
    .then(state => {
      if (state.state === STATE_IDLE) {
        handleIdleState(resolve, reject);
      } else if (state.state === STATE_PLAYING) {
        answer = state.answer;
        handlePlayingState(resolve, reject);
      }
    });
}

function handleIdleState(resolve, reject) {
  let text = this.message.text.toLowerCase();
  let photoPath;

  if (isGameRequestMessage(text)) {
    getRandomTask()
      .then(task => {
        answer = task.answer;
        console.log(answer);
        setGameState({state: STATE_PLAYING, answer: task.answer});
        timeoutObj = setTimeout(giveHint, STEP_INTERVAL);
        resolve(true);
        
        // TODO: больше приветственных сообщений
        let welcomeMessages = [
          `Игра начинается, отгадывать могут все! 😏 Что это за ${task.category}?`,
          `Я люблю играть! 😊 Перед вами ${task.category}, сможете угадать, кто это?`,
          `Конечно! Вот картинка, на картинке ${task.category}. Назовёте имя — победа за вами! ☺`,
        ];

        // TODO: получение фото с помощью API Google
        photoPath = __dirname + '/task.jpg';

        // TODO: обработка фотографии

        return vk.sendMessage(welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)]);
      })
      .then(response => {
        return vk.sendPhoto(photoPath);
      });
  } else {
    resolve(false);
  }
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
    `Не узнали? Это же ${answer}!`,
    `⏱ Время истекло! Правильный ответ — ${answer}`,
  ];

  photoPath = __dirname + '/full.jpg';

  vk.sendMessage(answerMessages[Math.floor(Math.random() * answerMessages.length)])
  .then(response => {
    return vk.sendPhoto(photoPath);
  });
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
          `Браво, ${name}! 👏`,
          `${name}, ты умница! 😃`,
          `Правильно, ${name}! 👍 Это действительно ${answer}`,
          `И в этом раунде побеждает ${name}! 😎`,
          `${name}, как тебе это удаётся? 🙀 `,
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