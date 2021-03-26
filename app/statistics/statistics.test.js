const textMessage = { text: 'Hello', from_id: 1111, conversation_message_id: 1 };
const stickerMessage = {
  attachments: [
    {
      type: 'sticker',
      sticker: { sticker_id: 1 }
    }],
  from_id: 1111,
  conversation_message_id: 1
};
const audioMessage = {
  attachments: [
    {
      type: 'audio_message',
      audio_message: { link_mp3: 'link_mp3' }
    }],
  from_id: 2222,
  conversation_message_id: 1
};
const repostMessage = {
  attachments: [
    {
      type: 'wall',
      wall: { id: 1 }
    }],
  from_id: 1111,
  conversation_message_id: 1
};
const previouslyHandledMessage = { text: 'Hello', from_id: 1111, conversation_message_id: 9999 };

beforeAll(() => {

});

afterEach(() => {
  jest.clearAllMocks();
  jest.resetModules();
});

describe('Collect statistics', () => {
  test('When bot receives a message and message has not been handled before, bot gathers info from this message', done => {
    setMocks();
    const handleMessage = require('./statistics').handleMessage;
    const db = require('../db');
    handleMessage(textMessage);
    setTimeout(() => {
      expect(db.query).toHaveBeenCalledTimes(4);
      done();
    }, 500);
  });

  test('When bot receives a message and message has been handled before, bot does not gather info from this message', done => {
    setMocks();
    const handleMessage = require('./statistics').handleMessage;
    const db = require('../db');
    handleMessage(previouslyHandledMessage);
    setTimeout(() => {
      expect(db.query).toHaveBeenCalledTimes(1);
      done();
    }, 500);
  });

  test('During gathering of info from message bot increases total messages counter', done => {
    setMocks();
    const handleMessage = require('./statistics').handleMessage;
    const db = require('../db');
    handleMessage(textMessage);
    setTimeout(() => {
      expect(db.query.mock.calls[3][0]).toMatch(/SET value = 101 WHERE id = -1/);
      done();
    }, 500);
  });

  test('During gathering of info from message bot increases voice messages counter if needed', done => {
    setMocks();
    const handleMessage = require('./statistics').handleMessage;
    const db = require('../db');
    handleMessage(audioMessage);
    setTimeout(() => {
      expect(db.query.mock.calls[3][0]).toMatch(/SET value = 6 WHERE id = -2/);
      done();
    }, 500);
  });

  test('During gathering of info from message bot increases stickers counter if needed', done => {
    setMocks();
    const handleMessage = require('./statistics').handleMessage;
    const db = require('../db');
    handleMessage(stickerMessage);
    setTimeout(() => {
      expect(db.query.mock.calls[3][0]).toMatch(/SET value = 11 WHERE id = -3/);
      done();
    }, 500);
  });

  test('During gathering of info from message bot increases reposts counter if needed', done => {
    setMocks();
    const handleMessage = require('./statistics').handleMessage;
    const db = require('../db');
    handleMessage(repostMessage);
    setTimeout(() => {
      expect(db.query.mock.calls[3][0]).toMatch(/SET value = 21 WHERE id = -4/);
      done();
    }, 500);
  });

  test('During gathering of info from message bot does not increase voice messages counter if not needed', done => {
    setMocks();
    const handleMessage = require('./statistics').handleMessage;
    const db = require('../db');
    handleMessage(textMessage);
    setTimeout(() => {
      expect(db.query.mock.calls[3][0]).not.toMatch(/SET value = [0-9]* WHERE id = -2/);
      done();
    }, 500);
  });

  test('During gathering of info from message bot does not increase stickers counter if not needed', done => {
    setMocks();
    const handleMessage = require('./statistics').handleMessage;
    const db = require('../db');
    handleMessage(textMessage);
    setTimeout(() => {
      expect(db.query.mock.calls[3][0]).not.toMatch(/SET value = [0-9]* WHERE id = -3/);
      done();
    }, 500);
  });

  test('During gathering of info from message bot does not increase reposts counter if not needed', done => {
    setMocks();
    const handleMessage = require('./statistics').handleMessage;
    const db = require('../db');
    handleMessage(textMessage);
    setTimeout(() => {
      expect(db.query.mock.calls[3][0]).not.toMatch(/SET value = [0-9]* WHERE id = -4/);
      done();
    }, 500);
  });

  test('During gathering of info from message bot increases messages counter for the current sender ' +
             '(case with the very first message of user)', done => {
    setMocks();
    const handleMessage = require('./statistics').handleMessage;
    const db = require('../db');
    handleMessage(textMessage);
    setTimeout(() => {
      expect(db.query.mock.calls[3][0]).toMatch(/INSERT INTO .* VALUES\(1111, 1\)/);
      done();
    }, 500);
  });

  test('During gathering of info from message bot increases messages counter for the current sender ' +
             '(case with not first message of user)', done => {
    setMocks();
    const handleMessage = require('./statistics').handleMessage;
    const db = require('../db');
    handleMessage(audioMessage);
    setTimeout(() => {
      expect(db.query.mock.calls[3][0]).toMatch(/SET value = 26 WHERE id = 2222/);
      done();
    }, 500);
  });

  test('Bot always passes message further to following handlers', () => {
    setMocks();
    const handleMessage = require('./statistics').handleMessage;
    expect(handleMessage(textMessage)).toBe(false);
    expect(handleMessage(audioMessage)).toBe(false);
    expect(handleMessage(stickerMessage)).toBe(false);
    expect(handleMessage(repostMessage)).toBe(false);
  });
});

describe('Get statistics', () => {
  test('Bot correctly returns data for total amount of messages', async () => {
    setMocks();
    const getStatistics = require('./statistics').getStatistics;
    const statistics = await getStatistics();
    expect(statistics.totalAmount).toBe(100);
  });

  test('Bot correctly returns data for amount of audio messages', async () => {
    setMocks();
    const getStatistics = require('./statistics').getStatistics;
    const statistics = await getStatistics();
    expect(statistics.audioMessagesAmount).toBe(5);
  });

  test('Bot correctly returns data for amount of stickers', async () => {
    setMocks();
    const getStatistics = require('./statistics').getStatistics;
    const statistics = await getStatistics();
    expect(statistics.stickersAmount).toBe(10);
  });

  test('Bot correctly returns data for amount of reposts', async () => {
    setMocks();
    const getStatistics = require('./statistics').getStatistics;
    const statistics = await getStatistics();
    expect(statistics.repostsAmount).toBe(20);
  });

  test('Bot correctly returns data for total amount of messages in previous month', async () => {
    setMocks();
    const getStatistics = require('./statistics').getStatistics;
    const statistics = await getStatistics();
    expect(statistics.previousMonthAmount).toBe(400);
  });

  test('Bot does not return data for previous month if it is not present', async () => {
    setMocks({prevMonth: -1});
    const getStatistics = require('./statistics').getStatistics;
    const statistics = await getStatistics();
    expect(statistics.previousMonthAmount).toBeNull();
  });

  test('Bot correctly returns data for most active user (case when there is one most active user)', async () => {
    setMocks({ mostActiveUsers: [
        { id: 3333, value: 123 },
        { id: 4444, value: 1 },
        { id: 5555, value: 1 },
        { id: 6666, value: 1 },
    ]});
    const getStatistics = require('./statistics').getStatistics;
    const statistics = await getStatistics();
    expect(statistics.mostActiveUsers).toBeTruthy();
    expect(statistics.mostActiveUsers.length).toBe(1);
    expect(statistics.mostActiveUsers[0]).toBe(3333);
  });

  test('Bot correctly returns data for most active user (case when there are two most active users)', async () => {
    setMocks({ mostActiveUsers: [
        { id: 3333, value: 123 },
        { id: 4444, value: 123 },
        { id: 5555, value: 1 },
        { id: 6666, value: 1 },
      ]});
    const getStatistics = require('./statistics').getStatistics;
    const statistics = await getStatistics();
    expect(statistics.mostActiveUsers).toBeTruthy();
    expect(statistics.mostActiveUsers.length).toBe(2);
    expect(statistics.mostActiveUsers).toContain(3333);
    expect(statistics.mostActiveUsers).toContain(4444);
  });

  test('Bot correctly returns data for most active user (case when there are three most active users)', async () => {
    setMocks({ mostActiveUsers: [
        { id: 3333, value: 123 },
        { id: 4444, value: 123 },
        { id: 5555, value: 123 },
        { id: 6666, value: 1 },
      ]});
    const getStatistics = require('./statistics').getStatistics;
    const statistics = await getStatistics();
    expect(statistics.mostActiveUsers).toBeTruthy();
    expect(statistics.mostActiveUsers.length).toBe(3);
    expect(statistics.mostActiveUsers).toContain(3333);
    expect(statistics.mostActiveUsers).toContain(4444);
    expect(statistics.mostActiveUsers).toContain(5555);
  });
});

describe('Reset statistics', () => {
  test('Bot correctly resets statistics for current month', done => {
    setMocks();
    const resetStatistics = require('./statistics').resetStatistics;
    const db = require('../db');
    resetStatistics();
    setTimeout(() => {
      expect(db.query.mock.calls[1][0]).toMatch(/SET value = 0 WHERE id <> -5/);
      done();
    }, 500);
  });

  test('Bot correctly sets statistics for previous month', done => {
    setMocks();
    const resetStatistics = require('./statistics').resetStatistics;
    const db = require('../db');
    resetStatistics();
    setTimeout(() => {
      expect(db.query.mock.calls[1][0]).toMatch(/SET value = 100 WHERE id = -5/);
      done();
    }, 500);
  });
});

function setMocks(options) {
  jest.doMock('../db');
  const db = require('../db');

  const statistics = { rows: [
      { id: -1, value: 100 },  // total
      { id: -2, value: 5 }, // audio
      { id: -3, value: 10 }, // stickers
      { id: -4, value: 20 }, // reposts
      { id: -5, value: options && options.prevMonth || 400 }, // prev month
      { id: 2222, value: 25}, // amount for user 2222
  ]};

  if (options && options.mostActiveUsers) {
    options.mostActiveUsers.forEach(row => statistics.rows.push(row));
  }

  db.query.mockImplementation(_query => {
    if (_query.includes('WHERE conversation_message_id = 9999')) {
      return Promise.resolve({ rows: [{ conversation_message_id: 9999 }] });
    } else if (_query.includes('SELECT * FROM friends_vk_bot.statistics')) {
      return Promise.resolve(statistics);
    } else {
      return Promise.resolve({ rows: []});
    }
  });
}
