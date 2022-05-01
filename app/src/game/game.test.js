require('dotenv').config();

const messageWithGameRequest = { text: 'Бот, давай играть' };

const messageWithCorrectAnswer = {
  text: 'абракадабра',
  from_id: 1,
};

const messageWithCorrectAnswerInUppercase = {
  text: 'АБРАКАДАБРА',
  from_id: 1,
};

const messageWithIncorrectAnswer = { text: 'Попытка' };
const commonMessageWithBotMention = { text: 'Бот, привет' };
const messageWithoutText = { text: '' };

const messageWithAddWordRequest = { text: 'Бот, запомни слово покемон' };
const messageWithDeleteWordRequest = { text: 'Бот, забудь слово покемон' };

const searchQuotaExceededResponse = {
  error: {
    errors: [{
      domain: 'usageLimits'
    }]
  }
};

const googleSearchResponse = {
  items: [
    { link: 'https://www.example.com/result-1.jpg' },
    { link: 'https://www.example.com/result-2.jpg' },
  ]
};

const taskFromDb = { name: 'абракадабра' };

const originalSetTimeout = setTimeout;

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.clearAllMocks();
  jest.resetModules();
});

test('When bot receives a game start request and game is not started, new game starts ' +
     '(bot generates a task and sends a greeting message and a picture with task)', async () => {
  setMocks();
  const game = require('./game');
  const sender = require('../vk');
  const db = require('../db');
  game(messageWithGameRequest);
  await waitMs(500);
  expect(db.query).toHaveBeenCalledTimes(1);
  expect(sender.sendMessage).toHaveBeenCalledTimes(1);
  expect(sender.sendMessage.mock.calls[0][0]).toMatch(/Игра начинается/);
  expect(sender.sendPhotoToChat).toHaveBeenCalledTimes(1);
});

test('When bot receives a game start request and game is not started, bot does not pass the message further', () => {
  setMocks();
  const game = require('./game');
  expect(game(messageWithGameRequest)).toBe(true);
});

test('When bot receives a game start request and game is running, new game does not start ' +
     '(bot does not generate a new task, does not send a greeting message and does not send a picture with task)', async () => {
  setMocks();
  const game = require('./game');
  const sender = require('../vk');
  const db = require('../db');
  game(messageWithGameRequest);
  game(messageWithGameRequest);
  await waitMs(500);
  expect(db.query).toHaveBeenCalledTimes(1);
  expect(sender.sendMessage).toHaveBeenCalledTimes(1);
  expect(sender.sendPhotoToChat).toHaveBeenCalledTimes(1);
});

test('When bot receives a game start request and game is running, bot does not pass the message further', () => {
  setMocks();
  const game = require('./game');
  game(messageWithGameRequest);
  expect(game(messageWithGameRequest)).toBe(true);
});

test('When a game is running and bot receives correct answer, bot sends a success message with winner name', async () => {
  setMocks();
  const game = require('./game');
  const sender = require('../vk');
  game(messageWithGameRequest);
  await waitMs(100);
  game(messageWithCorrectAnswer);
  await waitMs(500);
  expect(sender.getUserName).toHaveBeenCalledWith(1);
  expect(sender.sendMessage.mock.calls[1][0]).toMatch(/Евлампий/);
  expect(sender.sendMessage.mock.calls[1][0]).toMatch(/абракадабра/);
});

test('When a game is running and bot receives correct answer, ' +
     'the game stops (no new hints are sent, no new words messages are handled)', async () => {
  setMocks();
  const game = require('./game');
  const sender = require('../vk');
  const admin = require('./admin');
  game(messageWithGameRequest);
  await waitMs(100);
  game(messageWithCorrectAnswer);
  game(messageWithIncorrectAnswer);
  jest.runAllTimers();
  await waitMs(500);
  expect(sender.getUserName).toHaveBeenCalledTimes(1);
  expect(sender.sendMessage).toHaveBeenCalledTimes(2);
  expect(sender.sendPhotoToChat).toHaveBeenCalledTimes(1);
  expect(admin.addWord).not.toHaveBeenCalled();
});

test('Bot can recognize a correct answer in uppercase', async () => {
  setMocks();
  const game = require('./game');
  const sender = require('../vk');
  game(messageWithGameRequest);
  await waitMs(100);
  game(messageWithCorrectAnswerInUppercase);
  await waitMs(500);
  expect(sender.getUserName).toHaveBeenCalledWith(1);
  expect(sender.sendMessage.mock.calls[1][0]).toMatch(/Евлампий/);
  expect(sender.sendMessage.mock.calls[1][0]).toMatch(/абракадабра/);
});

test('When a game is running and bot receives more than one correct answer, ' +
     'bot sends only one success message with first winner name', async () => {
  setMocks();
  const game = require('./game');
  const sender = require('../vk');
  game(messageWithGameRequest);
  await waitMs(100);
  game(messageWithCorrectAnswer);
  game(messageWithCorrectAnswer);
  await waitMs(500);
  expect(sender.getUserName).toHaveBeenCalledWith(1);
  expect(sender.sendMessage.mock.calls[1][0]).toMatch(/Евлампий/);
  expect(sender.sendMessage.mock.calls[1][0]).toMatch(/абракадабра/);
  expect(sender.getUserName).toHaveBeenCalledTimes(1);
  expect(sender.sendMessage).toHaveBeenCalledTimes(2);
});

test('When a game is running and bot receives a common message without correct answer, ' +
     'bot extracts a word and adds it to approval list', async () => {
  setMocks();
  const game = require('./game');
  const admin = require('./admin');
  game(messageWithGameRequest);
  await waitMs(100);
  game(messageWithIncorrectAnswer);
  expect(admin.addWord).toHaveBeenCalledTimes(1);
  expect(admin.addWord).toHaveBeenLastCalledWith('попытка', false);
});

test('When a game is running and bot receives a message with bot mentioning and it is not a word addition or deletion request, ' +
     'bot passes this message further', async () => {
  setMocks();
  const game = require('./game');
  game(messageWithGameRequest);
  await waitMs(100);
  expect(game(commonMessageWithBotMention)).toBe(false);
});

test('When a game is running and bot receives a message without text, bot passes this message further', async () => {
  setMocks();
  const game = require('./game');
  game(messageWithGameRequest);
  await waitMs(100);
  expect(game(messageWithoutText)).toBe(false);
});

test('When a game is running and bot does not get correct answer during first round, bot sends a hint', async () => {
  setMocks();
  const game = require('./game');
  const sender = require('../vk');
  game(messageWithGameRequest);
  await waitMs(100);
  jest.runOnlyPendingTimers();
  await waitMs(500);
  expect(sender.sendMessage.mock.calls[1][0]).toMatch(/подсказка/);
  expect(sender.sendPhotoToChat).toHaveBeenCalledTimes(2);
});

test('When a game is running and bot does not get correct answer during second round, ' +
     'bot sends a failure info and a correct answer', async () => {
  setMocks();
  const game = require('./game');
  const sender = require('../vk');
  game(messageWithGameRequest);
  await waitMs(100);
  jest.runAllTimers();
  await waitMs(10);
  jest.runAllTimers();
  await waitMs(500);
  expect(sender.sendMessage).toHaveBeenCalledTimes(4);
  expect(sender.sendMessage.mock.calls[3][0]).toMatch(/Не разгадали?/);
  expect(sender.sendMessage.mock.calls[3][0]).toMatch(/абракадабра/);
});

test('When a game is running and bot does not get correct answer during second round, ' +
     'the game stops (no new hints are sent, no new words messages are handled)', async () => {
  setMocks();
  const game = require('./game');
  const sender = require('../vk');
  const admin = require('./admin');
  game(messageWithGameRequest);
  await waitMs(100);
  jest.runAllTimers();
  await waitMs(10);
  jest.runAllTimers();
  game(messageWithIncorrectAnswer);
  game(messageWithCorrectAnswer);
  await waitMs(500);
  expect(sender.sendMessage).toHaveBeenCalledTimes(4);
  expect(sender.sendMessage.mock.calls[3][0]).not.toMatch(/И в этом раунде/);
  expect(sender.sendPhotoToChat).toHaveBeenCalledTimes(2);
  expect(sender.getUserName).toHaveBeenCalledTimes(0);
  expect(admin.addWord).toHaveBeenCalledTimes(0);
});

test('Bot can send an additional hint with first letter in first round', async () => {
  setMocks({ letterHintInFirstRound: true });
  const game = require('./game');
  const sender = require('../vk');
  game(messageWithGameRequest);
  await waitMs(100);
  jest.runAllTimers();
  await waitMs(10);
  jest.runAllTimers();
  await waitMs(500);
  expect(sender.sendMessage).toHaveBeenCalledTimes(4);
  expect(sender.sendMessage.mock.calls[1][0]).toMatch(/В моём слове 11 букв, первая — А/);
});

test('If bot did not send an additional hint with first letter in first round, ' +
     'it sends additional hint with first letter in second round', async () => {
  setMocks({ letterHintInFirstRound: false });
  const game = require('./game');
  const sender = require('../vk');
  game(messageWithGameRequest);
  await waitMs(100);
  jest.runAllTimers();
  await waitMs(10);
  jest.runAllTimers();
  await waitMs(500);
  expect(sender.sendMessage).toHaveBeenCalledTimes(4);
  expect(sender.sendMessage.mock.calls[2][0]).toMatch(/В моём слове 11 букв, первая — А/);
});

test('When bot receives a game start request and game is not started and daily quota of pictures search is exceeded, ' +
     'new game does not start (task is not sent)', async () => {
  setMocks({ searchQuotaExceeded: true });
  const game = require('./game');
  const sender = require('../vk');
  game(messageWithGameRequest);
  await waitMs(500);
  expect(sender.sendPhotoToChat).toHaveBeenCalledTimes(0);
});

test('When bot receives a game start request and game is not started and daily quota of pictures search is exceeded, ' +
     'bot sends a \'tired\' sticker and a refusal message', async () => {
  setMocks({ searchQuotaExceeded: true });
  const game = require('./game');
  const sender = require('../vk');
  game(messageWithGameRequest);
  await waitMs(500);
  expect(sender.sendMessage).toHaveBeenCalledTimes(1);
  expect(sender.sendMessage.mock.calls[0][0]).toMatch(/устал/);
  expect(sender.sendSticker).toHaveBeenCalledTimes(1);
  expect(sender.sendSticker.mock.calls[0][0]).toBe(13);
});

test('When bot receives a word addition request, bot extracts a word, remembers it and sends a success message', async () => {
  setMocks();
  const game = require('./game');
  const sender = require('../vk');
  const admin = require('./admin');
  game(messageWithAddWordRequest);
  await waitMs(100);
  expect(admin.addWord).toHaveBeenCalledTimes(1);
  expect(admin.addWord).toHaveBeenCalledWith('покемон');
  expect(sender.sendMessage).toHaveBeenCalledTimes(1);
  expect(sender.sendMessage.mock.calls[0][0]).toMatch(/Я запомнил слово "покемон"/);
});

test('When bot receives a word addition request and this word exists already, ' +
     'bot sends a message with information about duplicated word', async () => {
  setMocks({ duplicatedWord: true });
  const game = require('./game');
  const sender = require('../vk');
  const admin = require('./admin');
  game(messageWithAddWordRequest);
  await waitMs(100);
  expect(admin.addWord).toHaveBeenCalledTimes(1);
  expect(admin.addWord).toHaveBeenCalledWith('покемон');
  expect(sender.sendMessage).toHaveBeenCalledTimes(1);
  expect(sender.sendMessage.mock.calls[0][0]).toMatch(/Я уже знаю слово "покемон"/);
});

test('When bot receives a word deletion request, bot extracts a word, deletes it and sends a success message', async () => {
  setMocks({ duplicatedWord: true });
  const game = require('./game');
  const sender = require('../vk');
  const admin = require('./admin');
  game(messageWithDeleteWordRequest);
  await waitMs(100);
  expect(admin.deleteWord).toHaveBeenCalledTimes(1);
  expect(admin.deleteWord).toHaveBeenCalledWith('покемон');
  expect(sender.sendMessage).toHaveBeenCalledTimes(1);
  expect(sender.sendMessage.mock.calls[0][0]).toMatch(/Я забыл слово "покемон"/);
});


function setMocks(options) {
  jest.doMock('needle', () => (method, url) => {
    if (url.includes('google')) {
      return Promise.resolve({
        body: options?.searchQuotaExceeded ? searchQuotaExceededResponse : googleSearchResponse
      });
    }
    if (url.includes('jpg')) {
      return Promise.resolve({});
    }
  });

  jest.doMock('../vk');
  const sender = require('../vk');
  sender.sendMessage.mockResolvedValue('ok');
  sender.sendPhotoToChat.mockResolvedValue('ok');
  sender.getUserName
    .mockResolvedValueOnce('Евлампий')
    .mockResolvedValueOnce('Афанасий');

  jest.doMock('../db');
  const db = require('../db');
  db.query.mockImplementation(_query => {
    if (_query.includes('SELECT')) {
      return Promise.resolve({ rows: [ taskFromDb ]});
    }
  });

  jest.doMock('./admin');
  const admin = require('./admin');
  admin.addWord.mockResolvedValue(options?.duplicatedWord ? '23505' : null);
  admin.deleteWord.mockResolvedValue(null);

  jest.spyOn(global.Math, 'random').mockReturnValue(options?.letterHintInFirstRound ? 0.9 : 0.1);
}

async function waitMs(ms) {
  return new Promise(resolve => originalSetTimeout(() => resolve(), ms));
}
