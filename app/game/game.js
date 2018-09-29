const sender = require('../vk');
const dbClient = require('../db');

const TABLE_STATE = 'state';
const TABLE_ACTORS = 'actors';

const STATE_IDLE = 'idle';
const STATE_PLAYING = 'playing';

let message;

function getRandomTask() {
  // TODO: поддержка других категорий
  let tableName = TABLE_ACTORS;
  let category = 'актёр или актриса';

  let query = `
    SELECT name FROM friends_vk_bot.${tableName}
    WHERE 1 = 1;
  `;

  return dbClient().query(query)
    .then(result => {
      return {
        category: category,
        answer: result.rows[0].name.toLowerCase(),
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
        handlePlayingState(resolve, reject, state);
      }
    });
}

function handleIdleState(resolve, reject) {
  let text = this.message.text.toLowerCase();

  if (isGameRequestMessage(text)) {
    getRandomTask()
      .then(task => {
        setGameState({state: STATE_PLAYING, answer: task.answer});
        
        // TODO: больше приветственных сообщений
        let welcomeMessages = [
          `Игра начинается, отгадывать могут все! 😏 Что это за ${task.category}?`,
          `Я люблю играть! 😊 Перед вами ${task.category}, сможете угадать, кто это?`,
          `Конечно! Вот картинка, на картинке ${task.category}. Назовёте имя — победа за вами! ☺`,
        ];
        sender.sendMessage(welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)]);
        
        // TODO: отправлять картинку
        
        resolve(true);
      });
  } else {
    resolve(false);
  }
}

// TODO: подсказка, ответ через n секунд 

function handlePlayingState(resolve, reject, state) {
  let text = this.message.text.toLowerCase();

  // Если игра уже идёт, но кто-то написал новый запрос на игру,
  // нужно закончить обработку этого сообщения, чтобы не было наложений сценариев бота
  if(isGameRequestMessage(text)) {
    console.log('game is already running');
    resolve(true);
  }

  let answer = state.answer;
  let answerIsCorrect = checkAnswer(text, answer);

  if (answerIsCorrect) {
    setGameState({state: STATE_IDLE, answer: ''});
    // TODO: писать в ответном сообщении имя игрока
    sender.sendMessage(`Это правильный ответ!`);
    // TODO: отправлять полную картинку
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

function checkAnswer(entered, answer) {
  // TODO: более щадящая и интеллектуальная проверка корректности ответа
  return entered === answer;
}

module.exports = function(message) {  
  this.message = message;
  return new Promise(handleMessage);
}