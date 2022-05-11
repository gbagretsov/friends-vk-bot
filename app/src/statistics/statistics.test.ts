import handleMessage, {getStatistics, resetStatistics} from './statistics';
import db from '../db';
import vk from '../vk/vk';
import { VkUser } from '../vk/model/VkUser';
import {QueryResult} from 'pg';
import * as testMessages from './test-resources/messages';
import {Statistics} from './model/Statistics';

jest.mock('../db');

const getUserInfoSpy = jest.spyOn(vk, 'getUserInfo').mockImplementation(id => {
  return Promise.resolve({
    id,
    first_name: `Name ${id}`,
  } as VkUser);
});

let dbQuerySpy: jest.SpyInstance;

describe('Statistics', () => {
  describe('Collect statistics', () => {
    it('When bot receives a message, bot gathers info from this message', async () => {
      setMocks();
      await handleMessage(testMessages.textMessage);
      expect(dbQuerySpy).toHaveBeenCalledTimes(2);
    });

    test('During gathering of info from message bot increases total messages counter', async () => {
      setMocks();
      await handleMessage(testMessages.textMessage);
      expect(dbQuerySpy.mock.calls[1][0]).toMatch(/SET value = 101 WHERE id = -1/);
    });

    test('During gathering of info from message bot increases voice messages counter if needed', async () => {
      setMocks();
      await handleMessage(testMessages.audioMessage);
      expect(dbQuerySpy.mock.calls[1][0]).toMatch(/SET value = 6 WHERE id = -2/);
    });

    test('During gathering of info from message bot increases stickers counter if needed', async () => {
      setMocks();
      await handleMessage(testMessages.stickerMessage);
      expect(dbQuerySpy.mock.calls[1][0]).toMatch(/SET value = 11 WHERE id = -3/);
    });

    test('During gathering of info from message bot increases reposts counter if needed', async () => {
      setMocks();
      await handleMessage(testMessages.repostMessage);
      expect(dbQuerySpy.mock.calls[1][0]).toMatch(/SET value = 21 WHERE id = -4/);
    });

    test('During gathering of info from message bot does not increase voice messages counter if not needed', async () => {
      setMocks();
      await handleMessage(testMessages.textMessage);
      expect(dbQuerySpy.mock.calls[1][0]).not.toMatch(/SET value = [0-9]* WHERE id = -2/);
    });

    test('During gathering of info from message bot does not increase stickers counter if not needed', async () => {
      setMocks();
      await handleMessage(testMessages.textMessage);
      expect(dbQuerySpy.mock.calls[1][0]).not.toMatch(/SET value = [0-9]* WHERE id = -3/);
    });

    test('During gathering of info from message bot does not increase reposts counter if not needed', async () => {
      setMocks();
      await handleMessage(testMessages.textMessage);
      expect(dbQuerySpy.mock.calls[1][0]).not.toMatch(/SET value = [0-9]* WHERE id = -4/);
    });

    test('During gathering of info from message bot increases messages counter for the current sender ' +
      '(case with the very first message of user)', async () => {
      setMocks();
      await handleMessage(testMessages.textMessage);
      expect(dbQuerySpy.mock.calls[1][0]).toMatch(/INSERT INTO .* VALUES\(1111, 1\)/);
    });

    test('During gathering of info from message bot increases messages counter for the current sender ' +
      '(case with not first message of user)', async () => {
      setMocks();
      await handleMessage(testMessages.audioMessage);
      expect(dbQuerySpy.mock.calls[1][0]).toMatch(/SET value = 26 WHERE id = 2222/);
    });

    test('Bot always passes message further to following handlers', async () => {
      setMocks();
      expect(await handleMessage(testMessages.textMessage)).toBe(false);
      expect(await handleMessage(testMessages.audioMessage)).toBe(false);
      expect(await handleMessage(testMessages.stickerMessage)).toBe(false);
      expect(await handleMessage(testMessages.repostMessage)).toBe(false);
    });
  });

  describe('Get statistics', () => {
    test('Bot correctly returns data for total amount of messages', async () => {
      setMocks();
      const statistics = await getStatistics() as Statistics;
      expect(statistics.totalAmount).toBe(100);
    });

    test('Bot correctly returns data for amount of audio messages', async () => {
      setMocks();
      const statistics = await getStatistics() as Statistics;
      expect(statistics.audioMessagesAmount).toBe(5);
    });

    test('Bot correctly returns data for amount of stickers', async () => {
      setMocks();
      const statistics = await getStatistics() as Statistics;
      expect(statistics.stickersAmount).toBe(10);
    });

    test('Bot correctly returns data for amount of reposts', async () => {
      setMocks();
      const statistics = await getStatistics() as Statistics;
      expect(statistics.repostsAmount).toBe(20);
    });

    test('Bot correctly returns data for total amount of messages in previous month', async () => {
      setMocks();
      const statistics = await getStatistics() as Statistics;
      expect(statistics.previousMonthAmount).toBe(400);
    });

    test('Bot does not return data for previous month if it is not present', async () => {
      setMocks({ prevMonth: -1 });
      const statistics = await getStatistics() as Statistics;
      expect(statistics.previousMonthAmount).toBeNull();
    });

    test('Bot correctly returns data for most active user (case with one most active user)', async () => {
      setMocks({ mostActiveUsers: [
        { id: 3333, value: 123 },
        { id: 4444, value: 1 },
        { id: 5555, value: 1 },
        { id: 6666, value: 1 },
      ]});
      const statistics = await getStatistics() as Statistics;
      expect(statistics.mostActiveUsers).toBeTruthy();
      expect(statistics.mostActiveUsers.length).toBe(1);
      expect(statistics.mostActiveUsers[0].id).toBe(3333);
      expect(statistics.mostActiveUsers[0].first_name).toBe('Name 3333');
      expect(getUserInfoSpy.mock.calls[0][0]).toBe(3333);
    });

    test('Bot correctly returns data for most active user (case with two most active users)', async () => {
      setMocks({ mostActiveUsers: [
        { id: 3333, value: 123 },
        { id: 4444, value: 123 },
        { id: 5555, value: 1 },
        { id: 6666, value: 1 },
      ]});
      const statistics = await getStatistics() as Statistics;
      expect(statistics.mostActiveUsers).toBeTruthy();
      expect(statistics.mostActiveUsers.length).toBe(2);
      expect(statistics.mostActiveUsers[0].id).toBe(3333);
      expect(statistics.mostActiveUsers[0].first_name).toBe('Name 3333');
      expect(getUserInfoSpy.mock.calls[0][0]).toBe(3333);
      expect(statistics.mostActiveUsers[1].id).toBe(4444);
      expect(statistics.mostActiveUsers[1].first_name).toBe('Name 4444');
      expect(getUserInfoSpy.mock.calls[1][0]).toBe(4444);
    });

    test('Bot correctly returns data for most active user (case with three most active users)', async () => {
      setMocks({ mostActiveUsers: [
        { id: 3333, value: 123 },
        { id: 4444, value: 123 },
        { id: 5555, value: 123 },
        { id: 6666, value: 1 },
      ]});
      const statistics = await getStatistics() as Statistics;
      expect(statistics.mostActiveUsers).toBeTruthy();
      expect(statistics.mostActiveUsers.length).toBe(3);
      expect(statistics.mostActiveUsers[0].id).toBe(3333);
      expect(statistics.mostActiveUsers[0].first_name).toBe('Name 3333');
      expect(getUserInfoSpy.mock.calls[0][0]).toBe(3333);
      expect(statistics.mostActiveUsers[1].id).toBe(4444);
      expect(statistics.mostActiveUsers[1].first_name).toBe('Name 4444');
      expect(getUserInfoSpy.mock.calls[1][0]).toBe(4444);
      expect(statistics.mostActiveUsers[2].id).toBe(5555);
      expect(statistics.mostActiveUsers[2].first_name).toBe('Name 5555');
      expect(getUserInfoSpy.mock.calls[2][0]).toBe(5555);
    });
  });

  describe('Reset statistics', () => {
    test('Bot correctly resets statistics for current month', async () => {
      setMocks();
      await resetStatistics();
      expect(dbQuerySpy.mock.calls[1][0]).toMatch(/SET value = 0 WHERE id <> -5/);
    });

    test('Bot correctly sets statistics for previous month', async () => {
      setMocks();
      await resetStatistics();
      expect(dbQuerySpy.mock.calls[1][0]).toMatch(/SET value = 100 WHERE id = -5/);
    });
  });

  function setMocks(options?: {
    prevMonth?: number,
    mostActiveUsers?: { id: number, value: number }[]
  }): void {

    const statistics = { rows: [
      { id: -1, value: 100 },  // total
      { id: -2, value: 5 }, // audio
      { id: -3, value: 10 }, // stickers
      { id: -4, value: 20 }, // reposts
      { id: -5, value: options?.prevMonth || 400 }, // prev month
      { id: 2222, value: 25}, // amount for user 2222
    ]};

    if (options?.mostActiveUsers) {
      options.mostActiveUsers.forEach(row => statistics.rows.push(row));
    }

    dbQuerySpy = jest.spyOn(db, 'query').mockImplementation(_query => {
      let result: QueryResult;
      if (_query.includes('WHERE conversation_message_id = 9999')) {
        result = {rows: [{conversation_message_id: 9999}]} as QueryResult;
      } else if (_query.includes('SELECT * FROM friends_vk_bot.statistics')) {
        result = statistics as QueryResult;
      } else {
        result = { rows: new Array(0)} as QueryResult;
      }

      return Promise.resolve(result);
    });

  }
});

