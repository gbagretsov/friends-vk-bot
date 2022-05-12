import {config} from 'dotenv';
import game from './game';
import db from '../db';
import vk from '../vk/vk';
import admin from './admin';
import * as testMessages from './test-resources/messages';
import {googleSearchSuccessResponse, googleSearchQuotaExceededResponse} from './test-resources/google-responses';
import {QueryResult} from 'pg';
import {AddWordResult} from './model/AddWordResult';
import SpyInstance = jest.SpyInstance;

config();

const taskFromDb = { name: 'абракадабра' };
const googleSearchResponse: { body?: unknown } = { };

jest.useFakeTimers('modern');
jest.mock('../vk/vk');
jest.mock('../db');
jest.mock('./admin');
jest.mock('needle', () => (method: string, url: string) => {
  if (url.includes('google')) {
    return Promise.resolve(googleSearchResponse);
  }
  if (url.includes('jpg')) {
    return Promise.resolve({});
  }
});

const sendMessageSpy = jest.spyOn(vk, 'sendMessage').mockResolvedValue(true);
const sendPhotoToChatSpy = jest.spyOn(vk, 'sendPhotoToChat').mockResolvedValue();
const getUserNameSpy = jest.spyOn(vk, 'getUserName').mockResolvedValue('Евлампий');
const sendStickerSpy = jest.spyOn(vk, 'sendSticker').mockResolvedValue(true);

const dbQuerySpy = jest.spyOn(db, 'query').mockImplementation(_query => {
  return Promise.resolve({ rows: _query.includes('SELECT') ? [ taskFromDb ] : []} as QueryResult);
});

let adminAddWordSpy: SpyInstance;
const adminDeleteWordSpy = jest.spyOn(admin,'deleteWord').mockResolvedValue();

describe('Game', () => {
  afterEach(async () => {
    await endCurrentRound();
    await endCurrentRound();
  });

  describe('Game start request handling', () => {
    beforeEach(() => setMocks({ letterHintInFirstRound: false }));

    test('When bot receives a game start request and game is not started, new game starts ' +
      '(bot generates a task and sends a greeting message and a picture with task)', async () => {
      await game(testMessages.messageWithGameRequest);
      expect(dbQuerySpy).toHaveBeenCalledTimes(1);
      expect(sendMessageSpy).toHaveBeenCalledTimes(1);
      expect(sendMessageSpy.mock.calls[0][0]).toMatch(/Игра начинается/);
      expect(sendPhotoToChatSpy).toHaveBeenCalledTimes(1);
    });

    test('When bot receives a game start request and game is not started, bot does not pass the message further', async () => {
      expect(await game(testMessages.messageWithGameRequest)).toBe(true);
    });

    test('When bot receives a game start request and game is running, new game does not start ' +
      '(bot does not generate a new task, does not send a greeting message and does not send a picture with task)', async () => {
      await game(testMessages.messageWithGameRequest);
      await game(testMessages.messageWithGameRequest);
      expect(dbQuerySpy).toHaveBeenCalledTimes(1);
      expect(sendMessageSpy).toHaveBeenCalledTimes(1);
      expect(sendPhotoToChatSpy).toHaveBeenCalledTimes(1);
    });

    test('When bot receives a game start request and game is running, bot does not pass the message further', async () => {
      await game(testMessages.messageWithGameRequest);
      expect(await game(testMessages.messageWithGameRequest)).toBe(true);
    });
  });

  describe('Win messages handling', () => {
    test('When a game is running and bot receives correct answer, bot sends a success message with winner name', async () => {
      setMocks();
      await game(testMessages.messageWithGameRequest);
      await game(testMessages.messageWithCorrectAnswer);
      expect(getUserNameSpy).toHaveBeenCalledWith(1);
      expect(sendMessageSpy.mock.calls[1][0]).toMatch(/Евлампий/);
      expect(sendMessageSpy.mock.calls[1][0]).toMatch(/абракадабра/);
    });

    test('When a game is running and bot receives correct answer, ' +
      'the game stops (no new hints are sent, no new words messages are handled)', async () => {
      setMocks();
      await game(testMessages.messageWithGameRequest);
      await game(testMessages.messageWithCorrectAnswer);
      jest.clearAllMocks();
      await endCurrentRound();
      expect(getUserNameSpy).not.toHaveBeenCalled();
      expect(sendMessageSpy).not.toHaveBeenCalled();
      expect(sendPhotoToChatSpy).not.toHaveBeenCalled();
      expect(adminAddWordSpy).not.toHaveBeenCalled();
    });

    test('Bot can recognize a correct answer in uppercase', async () => {
      setMocks();
      await game(testMessages.messageWithGameRequest);
      await game(testMessages.messageWithCorrectAnswerInUppercase);
      expect(getUserNameSpy).toHaveBeenCalledWith(1);
      expect(sendMessageSpy.mock.calls[1][0]).toMatch(/Евлампий/);
      expect(sendMessageSpy.mock.calls[1][0]).toMatch(/абракадабра/);
    });

    test('When a game is running and bot receives more than one correct answer, ' +
      'bot sends only one success message with first winner name', async () => {
      setMocks();
      await game(testMessages.messageWithGameRequest);
      await game(testMessages.messageWithCorrectAnswer);
      await game(testMessages.messageWithCorrectAnswer);
      expect(getUserNameSpy).toHaveBeenCalledWith(1);
      expect(sendMessageSpy).toHaveBeenCalledTimes(2);
      expect(sendMessageSpy.mock.calls[1][0]).toMatch(/Евлампий/);
      expect(sendMessageSpy.mock.calls[1][0]).toMatch(/абракадабра/);
    });
  });

  describe('Failure handling', function () {
    it('When a game is running and bot does not get correct answer during second round, ' +
      'bot sends a failure info and a correct answer', async () => {
      setMocks();
      await game(testMessages.messageWithGameRequest);
      await endCurrentRound();
      await endCurrentRound();
      expect(sendMessageSpy).toHaveBeenCalledTimes(4);
      expect(sendMessageSpy.mock.calls[3][0]).toMatch(/Не разгадали?/);
      expect(sendMessageSpy.mock.calls[3][0]).toMatch(/абракадабра/);
    });

    test('When a game is running and bot does not get correct answer during second round, ' +
      'the game stops (no new hints are sent, no new words messages are handled)', async () => {
      setMocks();
      await game(testMessages.messageWithGameRequest);
      await endCurrentRound();
      await endCurrentRound();
      jest.clearAllMocks();
      await game(testMessages.messageWithIncorrectAnswer);
      await game(testMessages.messageWithCorrectAnswer);
      expect(sendMessageSpy).not.toHaveBeenCalled();
      expect(sendPhotoToChatSpy).not.toHaveBeenCalled();
      expect(getUserNameSpy).not.toHaveBeenCalled();
      expect(adminAddWordSpy).not.toHaveBeenCalled();
    });
  });

  describe('Attempt messages handling', () => {
    test('When a game is running and bot receives a common message without correct answer, ' +
      'bot extracts a word and adds it to approval list', async () => {
      setMocks();
      await game(testMessages.messageWithGameRequest);
      await game(testMessages.messageWithIncorrectAnswer);
      expect(adminAddWordSpy).toHaveBeenCalledTimes(1);
      expect(adminAddWordSpy).toHaveBeenCalledWith('попытка', false);
    });
  });

  describe('Handling of messages not related to game', () => {
    test('When a game is running and bot receives a message with bot mentioning and it is not a word addition or deletion request, ' +
      'bot passes this message further', async () => {
      setMocks();
      await game(testMessages.messageWithGameRequest);
      expect(await game(testMessages.commonMessageWithBotMention)).toBe(false);
    });

    test('When a game is running and bot receives a message without text, bot passes this message further', async () => {
      setMocks();
      await game(testMessages.messageWithGameRequest);
      expect(await game(testMessages.messageWithoutText)).toBe(false);
    });
  });

  describe('Hints handling', () => {
    test('When a game is running and bot does not get correct answer during first round, bot sends a hint', async () => {
      setMocks();
      await game(testMessages.messageWithGameRequest);
      await endCurrentRound();
      expect(sendMessageSpy.mock.calls[1][0]).toMatch(/подсказка/);
      expect(sendPhotoToChatSpy).toHaveBeenCalledTimes(2);
    });

    test('Bot can send an additional hint with first letter in first round', async () => {
      setMocks({ letterHintInFirstRound: true });
      await game(testMessages.messageWithGameRequest);
      expect(sendMessageSpy.mock.calls[1][0]).toMatch(/В моём слове 11 букв, первая — А/);
    });

    test('If bot did not send an additional hint with first letter in first round, ' +
      'it sends additional hint with first letter in second round', async () => {
      setMocks({ letterHintInFirstRound: false });
      await game(testMessages.messageWithGameRequest);
      await endCurrentRound();
      expect(sendMessageSpy.mock.calls[2][0]).toMatch(/В моём слове 11 букв, первая — А/);
    });
  });

  describe('Google Search daily quota excess handling', () => {
    test('When bot receives a game start request and game is not started and daily quota of pictures search is exceeded, ' +
      'new game does not start (task is not sent)', async () => {
      setMocks({ searchQuotaExceeded: true });
      await game(testMessages.messageWithGameRequest);
      expect(sendPhotoToChatSpy).not.toHaveBeenCalled();
    });

    test('When bot receives a game start request and game is not started and daily quota of pictures search is exceeded, ' +
      'bot sends a \'tired\' sticker and a refusal message', async () => {
      setMocks({ searchQuotaExceeded: true });
      await game(testMessages.messageWithGameRequest);
      expect(sendMessageSpy).toHaveBeenCalledTimes(1);
      expect(sendMessageSpy.mock.calls[0][0]).toMatch(/устал/);
      expect(sendStickerSpy).toHaveBeenCalledTimes(1);
      expect(sendStickerSpy.mock.calls[0][0]).toBe(13);
    });
  });

  describe('Word addition/deletion requests handling', () => {
    test('When bot receives a word addition request, bot extracts a word, remembers it and sends a success message', async () => {
      setMocks();
      await game(testMessages.messageWithAddWordRequest);
      expect(adminAddWordSpy).toHaveBeenCalledTimes(1);
      expect(adminAddWordSpy).toHaveBeenCalledWith('покемон', true);
      expect(sendMessageSpy).toHaveBeenCalledTimes(1);
      expect(sendMessageSpy.mock.calls[0][0]).toMatch(/Я запомнил слово "покемон"/);
    });

    test('When bot receives a word addition request and this word exists already, ' +
      'bot sends a message with information about duplicated word', async () => {
      setMocks({ duplicatedWord: true });
      await game(testMessages.messageWithAddWordRequest);
      expect(adminAddWordSpy).toHaveBeenCalledTimes(1);
      expect(adminAddWordSpy).toHaveBeenCalledWith('покемон', true);
      expect(sendMessageSpy).toHaveBeenCalledTimes(1);
      expect(sendMessageSpy.mock.calls[0][0]).toMatch(/Я уже знаю слово "покемон"/);
    });

    test('When bot receives a word deletion request, bot extracts a word, deletes it and sends a success message', async () => {
      setMocks();
      await game(testMessages.messageWithDeleteWordRequest);
      expect(adminDeleteWordSpy).toHaveBeenCalledTimes(1);
      expect(adminDeleteWordSpy).toHaveBeenCalledWith('покемон');
      expect(sendMessageSpy).toHaveBeenCalledTimes(1);
      expect(sendMessageSpy.mock.calls[0][0]).toMatch(/Я забыл слово "покемон"/);
    });
  });

});

function setMocks(options?: {
  searchQuotaExceeded?: boolean,
  duplicatedWord?: boolean,
  letterHintInFirstRound?: boolean,
}) {
  googleSearchResponse.body = options?.searchQuotaExceeded ? googleSearchQuotaExceededResponse : googleSearchSuccessResponse;
  adminAddWordSpy = jest.spyOn(admin,'addWord')
    .mockResolvedValue(options?.duplicatedWord ? AddWordResult.DUPLICATE_WORD : AddWordResult.SUCCESS);

  jest.spyOn(global.Math, 'random').mockReturnValue(options?.letterHintInFirstRound ? 0.9 : 0.1);
}

async function endCurrentRound() {
  jest.runOnlyPendingTimers();
  for (let i = 0; i < 10; i++) {
    await Promise.resolve();
  }
}
