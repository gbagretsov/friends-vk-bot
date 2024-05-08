import db from '../db';
import vk from '../vk/vk';
import {handleLookForPollInIncomingMessage as pollsReceiver, watchPolls} from './polls-watch';
import {messageWithAnonymousePoll, messageWithoutPoll, messageWithPublicPoll} from './test-resources/messages';
import {VkPoll} from '../vk/model/VkPoll';
import {VkUser} from '../vk/model/VkUser';
import {QueryResult} from 'pg';

jest.mock('../vk/vk');
jest.mock('../db');

const dbOneWatchedPoll = [{ id: 1000123, owner_id: 321 }];
const dbTwoWatchedPolls = [
  { id: 1000123, owner_id: 321 },
  { id: 1000124, owner_id: 321 },
];

const currentTimestamp = Math.floor(Date.now() / 1000);

function getVkGetPollsResponse(id: number, endDate: number, created: number, voters: number[], ownerId?: number): {poll_info: VkPoll, voters: number[]} {
  return {
    poll_info: {
      id,
      owner_id: ownerId || 1,
      end_date: endDate,
      created,
      question: 'Ваш любимый актёр',
      closed: false,
      anonymous: false,
    },
    voters,
  };
}

const conversationMembers: VkUser[] = [
  { id: 10001, screen_name: 'super_afonya', first_name: 'Афанасий'},
  { id: 10002, screen_name: 'i_am_bonya', first_name: 'Бонифаций'},
  { id: 10003, screen_name: 'vsevolod_the_great', first_name: 'Всеволод'},
  { id: 10004, screen_name: 'gavr', first_name: 'Гавриил'},
  { id: 10005, screen_name: 'dobryi_chelovek', first_name: 'Добрыня'},
] as VkUser[];

const vkGetPollsResponse: { poll_info: VkPoll; voters: number[] }[] = [];
const dbWatchedPollsResponse: { id: number, owner_id: number }[] = [];

const sendMessageSpy = jest.spyOn(vk, 'sendMessage').mockResolvedValue(true);
jest.spyOn(vk, 'getPolls').mockResolvedValue(vkGetPollsResponse);
jest.spyOn(vk, 'getConversationMembers').mockResolvedValue(conversationMembers);
jest.spyOn(vk, 'isPoll').mockImplementation(message => message.attachments[0]?.type === 'poll');

const dbQuerySpy = jest.spyOn(db, 'query').mockImplementation(_query => {
  const result = _query.includes('SELECT') ?
    {rows: dbWatchedPollsResponse} as QueryResult :
    {rows: [], oid: 1, rowCount: 1, fields: [], command: ''} as QueryResult;
  return Promise.resolve(result);
});

jest.spyOn(global.Math, 'random').mockReturnValue(0.1);

beforeEach(() => {
  vkGetPollsResponse.length = 0;
  dbWatchedPollsResponse.length = 0;
});

describe('Polls receiver', () => {
  test('When bot receives a message with any poll, bot stops further handling of this message', async () => {
    setMocks();
    expect(await pollsReceiver(messageWithAnonymousePoll)).toBe(true);
    expect(await pollsReceiver(messageWithPublicPoll)).toBe(true);
  });

  test('When bot receives a message with public poll, bot saves its ID and ID of author', async () => {
    setMocks();
    await pollsReceiver(messageWithPublicPoll);
    expect(dbQuerySpy).toHaveBeenCalledTimes(1);
    expect(dbQuerySpy.mock.calls[0][0]).toMatch(/100000123/);
    expect(dbQuerySpy.mock.calls[0][0]).toMatch(/321/);
  });

  test('When bot receives a message with anonymous poll, bot does not save any information about it', async () => {
    setMocks();
    await pollsReceiver(messageWithAnonymousePoll);
    expect(dbQuerySpy).not.toHaveBeenCalled();
  });

  test('When bot receives a message without poll, bot passes this message further', async () => {
    setMocks();
    expect(await pollsReceiver(messageWithoutPoll)).toBe(false);
  });
});

describe('Polls observer', () => {

  describe('Positive tests', () => {

    test('When bot observes that there are missing votes for a poll that was created more than one hour ago and is not finished, ' +
      'bot sends an information message about the poll', async () => {
      setMocks({
        dbWatchedPolls: dbOneWatchedPoll,
        vkGetPollsResponse: [getVkGetPollsResponse(
          1000123,
          currentTimestamp + 3600,
          currentTimestamp - 3601,
          [10001, 10002],
        )],
      });
      await watchPolls();
      expect(sendMessageSpy).toHaveBeenCalledTimes(1);
    });

    test('When bot observes that there are missing votes for a poll that was created more than one hour ago and does not have end date, ' +
      'bot sends an information message about the poll', async () => {
      setMocks({
        dbWatchedPolls: dbOneWatchedPoll,
        vkGetPollsResponse: [getVkGetPollsResponse(
          1000123,
          0,
          currentTimestamp - 3601,
          [10001, 10002]
        )],
      });
      await watchPolls();
      expect(sendMessageSpy).toHaveBeenCalledTimes(1);
    });

    test('Information message about a poll contains a list of names of missing voters ' +
      '(with mentions that trigger notification of user in VK)', async () => {
      setMocks({
        dbWatchedPolls: dbOneWatchedPoll,
        vkGetPollsResponse: [getVkGetPollsResponse(1000123,
          0,
          currentTimestamp - 3601,
          [10001, 10002]
        )],
      });
      await watchPolls();
      expect(sendMessageSpy).toHaveBeenCalledTimes(1);
      expect(sendMessageSpy.mock.calls[0][0].text).toMatch(/@vsevolod_the_great \(Всеволод\)/);
      expect(sendMessageSpy.mock.calls[0][0].text).toMatch(/@gavr \(Гавриил\)/);
      expect(sendMessageSpy.mock.calls[0][0].text).toMatch(/@dobryi_chelovek \(Добрыня\)/);
    });

    test('Information message about a poll contains topic of the poll', async () => {
      setMocks({
        dbWatchedPolls: dbOneWatchedPoll,
        vkGetPollsResponse: [getVkGetPollsResponse(
          1000123,
          0,
          currentTimestamp - 3601,
          [10001, 10002]
        )],
      });
      await watchPolls();
      expect(sendMessageSpy).toHaveBeenCalledTimes(1);
      expect(sendMessageSpy.mock.calls[0][0].text).toMatch(/Ваш любимый актёр/);
    });

    test('Information message about a poll contains link to the poll', async () => {
      setMocks({
        dbWatchedPolls: dbOneWatchedPoll,
        vkGetPollsResponse: [getVkGetPollsResponse(
          1000123,
          0,
          currentTimestamp - 3601,
          [10001, 10002],
          222,
        )],
      });
      await watchPolls();
      expect(sendMessageSpy).toHaveBeenCalledTimes(1);
      expect(sendMessageSpy.mock.calls[0][0].text).toMatch(/https:\/\/vk.com\/poll222_1000123/);
    });

    test('Information message about a poll does not contain names or mentions of users who have already voted in the poll', async () => {
      setMocks({
        dbWatchedPolls: dbOneWatchedPoll,
        vkGetPollsResponse: [getVkGetPollsResponse(
          1000123,
          0,
          currentTimestamp - 3601,
          [10001, 10002]
        )],
      });
      await watchPolls();
      expect(sendMessageSpy).toHaveBeenCalledTimes(1);
      expect(sendMessageSpy.mock.calls[0][0].text).not.toMatch(/Афанасий/);
      expect(sendMessageSpy.mock.calls[0][0].text).not.toMatch(/Бонифаций/);
      expect(sendMessageSpy.mock.calls[0][0].text).not.toMatch(/@super_afonya/);
      expect(sendMessageSpy.mock.calls[0][0].text).not.toMatch(/@i_am_bonya/);
    });

    test('Bot can observe several polls', async () => {
      setMocks({
        dbWatchedPolls: dbTwoWatchedPolls,
        vkGetPollsResponse: [getVkGetPollsResponse(
          1000123,
          0,
          currentTimestamp - 3601,
          [10001, 10002]
        ), getVkGetPollsResponse(
          1000124,
          0,
          currentTimestamp - 3601,
          [10003, 10004]
        )],
      });
      await watchPolls();
      expect(sendMessageSpy).toHaveBeenCalledTimes(2);
    });

    test('Bot observes maximum five polls at a time', async () => {
      setMocks({
        dbWatchedPolls: dbOneWatchedPoll,
        vkGetPollsResponse: [getVkGetPollsResponse(
          1000123,
          0,
          currentTimestamp - 3601,
          [10001, 10002]
        )],
      });
      await watchPolls();
      expect(dbQuerySpy.mock.calls[0][0]).toMatch(/LIMIT 5/);
    });
  });

  describe('Negative tests', () => {
    test('When there are no watched polls, bot does not send any messages', async () => {
      setMocks({
        dbWatchedPolls: []
      });
      await watchPolls();
      expect(sendMessageSpy).not.toHaveBeenCalled();
    });

    test('When bot observes a poll that was created less than one hour ago, bot does not send any information about missing voters', async () => {
      setMocks({
        dbWatchedPolls: dbOneWatchedPoll,
        vkGetPollsResponse: [getVkGetPollsResponse(
          1000123,
          0,
          currentTimestamp - 600,
          [10001, 10002]
        )],
      });
      await watchPolls();
      expect(sendMessageSpy).not.toHaveBeenCalled();
    });

    test('When bot observes that there are no missing voters for a poll, bot does not send any messages', async () => {
      setMocks({
        dbWatchedPolls: dbOneWatchedPoll,
        vkGetPollsResponse: [getVkGetPollsResponse(
          1000123,
          0,
          currentTimestamp - 3601,
          [10001, 10002, 10003, 10004, 10005]
        )],
      });
      await watchPolls();
      expect(sendMessageSpy).not.toHaveBeenCalled();
    });

    test('When bot observes that there are no missing voters for a poll, bot removes poll ID from watch list', async () => {
      setMocks({
        dbWatchedPolls: dbOneWatchedPoll,
        vkGetPollsResponse: [getVkGetPollsResponse(
          1000123,
          0,
          currentTimestamp - 3601,
          [10001, 10002, 10003, 10004, 10005]
        )],
      });
      await watchPolls();
      expect(dbQuerySpy.mock.calls[1][0]).toMatch(/DELETE/);
      expect(dbQuerySpy.mock.calls[1][0]).toMatch(/1000123/);
    });

    test('When bot observes that a poll is finished, bot does not send any messages', async () => {
      setMocks({
        dbWatchedPolls: dbOneWatchedPoll,
        vkGetPollsResponse: [getVkGetPollsResponse(
          1000123,
          currentTimestamp - 1,
          currentTimestamp - 3601,
          [10001, 10002]
        )],
      });
      await watchPolls();
      expect(sendMessageSpy).not.toHaveBeenCalled();
    });

    test('When bot observes that a poll is finished, bot removes poll ID from watch list', async () => {
      setMocks({
        dbWatchedPolls: dbOneWatchedPoll,
        vkGetPollsResponse: [getVkGetPollsResponse(
          1000123,
          currentTimestamp - 1,
          currentTimestamp - 3601,
          [10001, 10002, 10003, 10004, 10005]
        )],
      });
      await watchPolls();
      expect(dbQuerySpy.mock.calls[1][0]).toMatch(/DELETE/);
      expect(dbQuerySpy.mock.calls[1][0]).toMatch(/1000123/);
    });

  });

});

function setMocks(options?: {
  vkGetPollsResponse?: { poll_info: VkPoll; voters: number[] }[],
  dbWatchedPolls?: { id: number, owner_id: number }[]
}) {

  if (options?.vkGetPollsResponse) {
    for (let i = 0; i < options.vkGetPollsResponse.length; i++) {
      vkGetPollsResponse[i] = options.vkGetPollsResponse[i];
    }
  }

  if (options?.dbWatchedPolls) {
    for (let i = 0; i < options.dbWatchedPolls.length; i++) {
      dbWatchedPollsResponse[i] = options.dbWatchedPolls[i];
    }
  }
}
