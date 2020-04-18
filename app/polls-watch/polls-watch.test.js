const messageWithPublicPoll = {
  attachments: [{
    type: 'poll',
    poll: {
      id: 100000123,
      owner_id: 321,
      anonymous: false,
    }
  }]
};

const messageWithAnonymousePoll = {
  attachments: [{
    type: 'poll',
    poll: {
      id: 100000123,
      owner_id: 321,
      anonymous: true,
    }
  }]
};

const messageWithoutPoll = {
  attachments: []
};

const dbOneWatchedPoll = [{ id: 1000123, owner_id: 321 }];
const dbTwoWatchedPolls = [
  { id: 1000123, owner_id: 321 },
  { id: 1000124, owner_id: 321 },
];

const currentTimestamp = Math.floor(Date.now() / 1000);

const getVkGetPollsResponse = (id, endDate, created, voters) => {
  return {
    poll_info: {
      id,
      end_date: endDate,
      created: created,
      question: 'Ваш любимый актёр'
    },
    voters,
  };
};

const conversationMembers = [
  { id: 10001, screen_name: 'super_afonya', first_name: 'Афанасий'},
  { id: 10002, screen_name: 'i_am_bonya', first_name: 'Бонифаций'},
  { id: 10003, screen_name: 'vsevolod_the_great', first_name: 'Всеволод'},
  { id: 10004, screen_name: 'gavr', first_name: 'Гавриил'},
  { id: 10005, screen_name: 'dobryi_chelovek', first_name: 'Добрыня'},
];

beforeAll(() => {
  jest.spyOn(global.Math, 'random').mockReturnValue(0.1);
});


afterEach(() => {
  jest.clearAllMocks();
  jest.resetModules();
});

describe('Polls receiver', () => {
  test('When bot receives a message with any poll, bot stops further handling of this message', () => {
    setMocks();
    const pollsReceiver = require('./polls-watch').handleLookForPollInIncomingMessage;
    expect(pollsReceiver(messageWithAnonymousePoll)).toBe(true);
    expect(pollsReceiver(messageWithPublicPoll)).toBe(true);
  });

  test('When bot receives a message with public poll, bot saves its ID and ID of author', () => {
    setMocks();
    const db = require('../db');
    const pollsReceiver = require('./polls-watch').handleLookForPollInIncomingMessage;
    pollsReceiver(messageWithPublicPoll);
    expect(db.query).toHaveBeenCalledTimes(1);
    expect(db.query.mock.calls[0][0]).toMatch(/100000123/);
    expect(db.query.mock.calls[0][0]).toMatch(/321/);
  });

  test('When bot receives a message with anonymous poll, bot does not save any information about it', () => {
    setMocks();
    const db = require('../db');
    const pollsReceiver = require('./polls-watch').handleLookForPollInIncomingMessage;
    pollsReceiver(messageWithAnonymousePoll);
    expect(db.query).not.toHaveBeenCalled();
  });

  test('When bot receives a message without poll, bot passes this message further', () => {
    setMocks();
    const pollsReceiver = require('./polls-watch').handleLookForPollInIncomingMessage;
    expect(pollsReceiver(messageWithoutPoll)).toBe(false);
  });
});

describe('Polls observer', () => {
  test('When there are no watched polls, bot does not send any messages', done => {
    setMocks({
      dbWatchedPolls: []
    });
    const pollsObserver = require('./polls-watch').watchPolls;
    const sender = require('../vk');
    pollsObserver();
    setTimeout(() => {
      expect(sender.sendMessage).not.toHaveBeenCalled();
      done();
    }, 500);
  });

  test('When bot observes that there are missing votes for a poll that was created more than one hour ago and is not finished, ' +
       'bot sends an information message about the poll', done => {
    setMocks({
      dbWatchedPolls: dbOneWatchedPoll,
      vkGetPollsResponse: [getVkGetPollsResponse(
        1000123,
        currentTimestamp + 3600,
        currentTimestamp - 3601,
        [10001, 10002]
      )],
    });
    const pollsObserver = require('./polls-watch').watchPolls;
    const sender = require('../vk');
    pollsObserver();
    setTimeout(() => {
      expect(sender.sendMessage).toHaveBeenCalledTimes(1);
      done();
    }, 500);
  });

  test('When bot observes that there are missing votes for a poll that was created more than one hour ago and does not have end date, ' +
       'bot sends an information message about the poll', done => {
    setMocks({
      dbWatchedPolls: dbOneWatchedPoll,
      vkGetPollsResponse: [getVkGetPollsResponse(
        1000123,
        0,
        currentTimestamp - 3601,
        [10001, 10002]
      )],
    });
    const pollsObserver = require('./polls-watch').watchPolls;
    const sender = require('../vk');
    pollsObserver();
    setTimeout(() => {
      expect(sender.sendMessage).toHaveBeenCalledTimes(1);
      done();
    }, 500);
  });

  test('Information message about a poll contains a list of names of missing voters ' +
       '(with mentions that trigger notification of user in VK)', done => {
    setMocks({
      dbWatchedPolls: dbOneWatchedPoll,
      vkGetPollsResponse: [getVkGetPollsResponse(1000123,
        0,
        currentTimestamp - 3601,
        [10001, 10002]
      )],
    });
    const pollsObserver = require('./polls-watch').watchPolls;
    const sender = require('../vk');
    pollsObserver();
    setTimeout(() => {
      expect(sender.sendMessage).toHaveBeenCalledTimes(1);
      expect(sender.sendMessage.mock.calls[0][0]).toMatch(/@vsevolod_the_great \(Всеволод\)/);
      expect(sender.sendMessage.mock.calls[0][0]).toMatch(/@gavr \(Гавриил\)/);
      expect(sender.sendMessage.mock.calls[0][0]).toMatch(/@dobryi_chelovek \(Добрыня\)/);
      done();
    }, 100);
  });

  test('Information message about a poll contains topic of the poll', done => {
    setMocks({
      dbWatchedPolls: dbOneWatchedPoll,
      vkGetPollsResponse: [getVkGetPollsResponse(
        1000123,
        0,
        currentTimestamp - 3601,
        [10001, 10002]
      )],
    });
    const pollsObserver = require('./polls-watch').watchPolls;
    const sender = require('../vk');
    pollsObserver();
    setTimeout(() => {
      expect(sender.sendMessage).toHaveBeenCalledTimes(1);
      expect(sender.sendMessage.mock.calls[0][0]).toMatch(/Ваш любимый актёр/);
      done();
    }, 100);
  });

  test('Information message about a poll does not contain names or mentions of users who have already voted in the poll', done => {
    setMocks({
      dbWatchedPolls: dbOneWatchedPoll,
      vkGetPollsResponse: [getVkGetPollsResponse(
        1000123,
        0,
        currentTimestamp - 3601,
        [10001, 10002]
      )],
    });
    const pollsObserver = require('./polls-watch').watchPolls;
    const sender = require('../vk');
    pollsObserver();
    setTimeout(() => {
      expect(sender.sendMessage).toHaveBeenCalledTimes(1);
      expect(sender.sendMessage.mock.calls[0][0]).not.toMatch(/Афанасий/);
      expect(sender.sendMessage.mock.calls[0][0]).not.toMatch(/Бонифаций/);
      expect(sender.sendMessage.mock.calls[0][0]).not.toMatch(/@super_afonya/);
      expect(sender.sendMessage.mock.calls[0][0]).not.toMatch(/@i_am_bonya/);
      done();
    }, 100);
  });

  test('When bot observes a poll that was created less than one hour ago, bot does not send any information about missing voters', done => {
    setMocks({
      dbWatchedPolls: dbOneWatchedPoll,
      vkGetPollsResponse: [getVkGetPollsResponse(
        1000123,
        0,
        currentTimestamp - 600,
        [10001, 10002]
      )],
    });
    const pollsObserver = require('./polls-watch').watchPolls;
    const sender = require('../vk');
    pollsObserver();
    setTimeout(() => {
      expect(sender.sendMessage).not.toHaveBeenCalled();
      done();
    }, 500);
  });

  test('When bot observes that there are no missing voters for a poll, bot does not send any messages', done => {
    setMocks({
      dbWatchedPolls: dbOneWatchedPoll,
      vkGetPollsResponse: [getVkGetPollsResponse(
        1000123,
        0,
        currentTimestamp - 3601,
        [10001, 10002, 10003, 10004, 10005]
      )],
    });
    const pollsObserver = require('./polls-watch').watchPolls;
    const sender = require('../vk');
    pollsObserver();
    setTimeout(() => {
      expect(sender.sendMessage).not.toHaveBeenCalled();
      done();
    }, 500);
  });

  test('When bot observes that there are no missing voters for a poll, bot removes poll ID from watch list', done => {
    setMocks({
      dbWatchedPolls: dbOneWatchedPoll,
      vkGetPollsResponse: [getVkGetPollsResponse(
        1000123,
        0,
        currentTimestamp - 3601,
        [10001, 10002, 10003, 10004, 10005]
      )],
    });
    const pollsObserver = require('./polls-watch').watchPolls;
    const db = require('../db');
    pollsObserver();
    setTimeout(() => {
      expect(db.query.mock.calls[1][0]).toMatch(/DELETE/);
      expect(db.query.mock.calls[1][0]).toMatch(/1000123/);
      done();
    }, 500);
  });

  test('When bot observes that a poll is finished, bot does not send any messages', done => {
    setMocks({
      dbWatchedPolls: dbOneWatchedPoll,
      vkGetPollsResponse: [getVkGetPollsResponse(
        1000123,
        currentTimestamp - 1,
        currentTimestamp - 3601,
        [10001, 10002]
      )],
    });
    const pollsObserver = require('./polls-watch').watchPolls;
    const sender = require('../vk');
    pollsObserver();
    setTimeout(() => {
      expect(sender.sendMessage).not.toHaveBeenCalled();
      done();
    }, 500);
  });

  test('When bot observes that a poll is finished, bot removes poll ID from watch list', done => {
    setMocks({
      dbWatchedPolls: dbOneWatchedPoll,
      vkGetPollsResponse: [getVkGetPollsResponse(
        1000123,
        currentTimestamp - 1,
        currentTimestamp - 3601,
        [10001, 10002, 10003, 10004, 10005]
      )],
    });
    const pollsObserver = require('./polls-watch').watchPolls;
    const db = require('../db');
    pollsObserver();
    setTimeout(() => {
      expect(db.query.mock.calls[1][0]).toMatch(/DELETE/);
      expect(db.query.mock.calls[1][0]).toMatch(/1000123/);
      done();
    }, 500);
  });

  test('Bot can observe several polls', done => {
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
    const pollsObserver = require('./polls-watch').watchPolls;
    const sender = require('../vk');
    pollsObserver();
    setTimeout(() => {
      expect(sender.sendMessage).toHaveBeenCalledTimes(2);
      done();
    }, 500);
  });

  test('Bot observes maximum five polls at a time', done => {
    setMocks({
      dbWatchedPolls: dbOneWatchedPoll,
      vkGetPollsResponse: [getVkGetPollsResponse(
        1000123,
        0,
        currentTimestamp - 3601,
        [10001, 10002]
      )],
    });
    const pollsObserver = require('./polls-watch').watchPolls;
    const db = require('../db');
    pollsObserver();
    setTimeout(() => {
      expect(db.query.mock.calls[0][0]).toMatch(/LIMIT 5/);
      done();
    }, 100);
  });
});


function setMocks(options) {
  jest.doMock('../vk');
  const sender = require('../vk');

  if (options && options.vkGetPollsResponse) {
    sender.getPolls.mockResolvedValue(options.vkGetPollsResponse);
    sender.getConversationMembers.mockResolvedValue(conversationMembers);
  }

  jest.doMock('../db');
  const db = require('../db');

  if (options && options.dbWatchedPolls) {
    db.query.mockImplementation(_query => {
      if (_query.includes('SELECT')) {
        return Promise.resolve({ rows: options.dbWatchedPolls });
      } else {
        return Promise.resolve();
      }
    });
  } else {
    db.query.mockResolvedValue(null);
  }
}
