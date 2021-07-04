const messageWithAppropriatePhrase = { text: 'appropriate phrase' };
const messageWithAppropriateSticker = {
  text: '',
  attachments: [{
    type: 'sticker',
    sticker: {
      sticker_id: 1337
    }
  }]
};

const oneTextReaction = [
  {
    id: 1,
    baseProbability: 50,
    additionalProbability: 0,
    type: 1,
    content: 'This is custom reaction'
  },
];

const oneTextReactionWithAdditionalProbability = [
  {
    id: 1,
    baseProbability: 50,
    additionalProbability: 20,
    type: 1,
    content: 'This is custom reaction'
  },
];

const twoTextReactions = [
  {
    id: 1,
    baseProbability: 50,
    additionalProbability: 0,
    type: 1,
    content: 'This is custom reaction 1'
  },
  {
    id: 2,
    baseProbability: 50,
    additionalProbability: 0,
    type: 1,
    content: 'This is custom reaction 2'
  },
];

const mixedSuccessfulAndFailedRandomCheck = [
  {
    id: 1,
    baseProbability: 50,
    additionalProbability: 20,
    type: 1,
    content: 'This is custom reaction 1'
  },
  {
    id: 2,
    baseProbability: 60,
    additionalProbability: 0,
    type: 1,
    content: 'This is custom reaction 2'
  },
  {
    id: 3,
    baseProbability: 10,
    additionalProbability: 0,
    type: 1,
    content: 'This is custom reaction 1'
  },
  {
    id: 4,
    baseProbability: 20,
    additionalProbability: 5,
    type: 1,
    content: 'This is custom reaction 2'
  },
];

const onePictureReaction = [
  {
    id: 1,
    baseProbability: 50,
    additionalProbability: 0,
    type: 2,
    content: 'https://i.ytimg.com/vi/OCO3qYvqQ8w/hqdefault.jpg'
  },
];

const oneYouTubeVideoReaction = [
  {
    id: 1,
    baseProbability: 50,
    additionalProbability: 0,
    type: 3,
    content: 'TU-xo3Pe2_c'
  },
];

const oneStickerReaction = [
  {
    id: 1,
    baseProbability: 50,
    additionalProbability: 0,
    type: 4,
    content: '1234'
  },
];


afterEach(() => {
  jest.restoreAllMocks();
  jest.resetModules();
});


// Positive tests

test('When bot receives a text message and finds appropriate rule, and random check is successful, ' +
     'bot sends a reaction stored in that rule', async done => {
  setMocks({ randomCheck: 0.001, reactions: oneTextReaction });
  const customReactions = require('./custom-reactions');
  const sender = require('../vk');
  const db = require('../db');
  await customReactions(messageWithAppropriatePhrase);
  setTimeout(() => {
    expect(db.query.mock.calls[0][0]).toMatch(/appropriate phrase/);
    expect(sender.sendMessage).toHaveBeenCalledTimes(1);
    expect(sender.sendMessage.mock.calls[0][0]).toEqual('This is custom reaction');
    done();
  }, 100);
});

test('When bot receives a text message and finds appropriate rule, ' +
     'and random check is successful for sum of base probability and additional probability, ' +
     'bot sends a reaction stored in that rule', async done => {
  setMocks({ randomCheck: 0.6, reactions: oneTextReactionWithAdditionalProbability });
  const customReactions = require('./custom-reactions');
  const sender = require('../vk');
  const db = require('../db');
  await customReactions(messageWithAppropriatePhrase);
  setTimeout(() => {
    expect(db.query.mock.calls[0][0]).toMatch(/appropriate phrase/);
    expect(sender.sendMessage).toHaveBeenCalledTimes(1);
    expect(sender.sendMessage.mock.calls[0][0]).toEqual('This is custom reaction');
    done();
  }, 100);
});

test('When bot receives a sticker and finds appropriate rule, and random check is successful, ' +
     'bot sends a reaction stored in that rule', async done => {
  setMocks({ randomCheck: 0.001, reactions: oneTextReaction });
  const customReactions = require('./custom-reactions');
  const sender = require('../vk');
  const db = require('../db');
  await customReactions(messageWithAppropriateSticker);
  setTimeout(() => {
    expect(db.query.mock.calls[0][0]).toMatch(/1337/);
    expect(sender.sendMessage).toHaveBeenCalledTimes(1);
    expect(sender.sendMessage.mock.calls[0][0]).toEqual('This is custom reaction');
    done();
  }, 100);
});

test('When bot finds appropriate rule to react, and random check is successful, ' +
     'and there are more than one possible reaction, bot sends only one reaction', async done => {
  setMocks({ randomCheck: 0.001, reactions: twoTextReactions });
  const customReactions = require('./custom-reactions');
  const sender = require('../vk');
  await customReactions(messageWithAppropriatePhrase);
  setTimeout(() => {
    expect(sender.sendMessage).toHaveBeenCalledTimes(1);
    expect(sender.sendMessage.mock.calls[0][0]).toMatch(/This is custom reaction/);
    done();
  }, 100);
});

test('When bot finds appropriate rule to react, and random check is successful, ' +
     'bot stops further handling of incoming message', async () => {
  setMocks({ randomCheck: 0.001, reactions: twoTextReactions });
  const customReactions = require('./custom-reactions');
  const result = await customReactions(messageWithAppropriatePhrase);
  expect(result).toBe(true);
});

test('When bot finds appropriate rule to react, and random check is successful, ' +
     'bot resets additional probability for that rule', async done => {
  setMocks({ randomCheck: 0.001, reactions: oneTextReaction });
  const customReactions = require('./custom-reactions');
  const db = require('../db');
  await customReactions(messageWithAppropriatePhrase);
  setTimeout(() => {
    expect(db.query.mock.calls[1][0]).toMatch(/additional_probability=0/);
    expect(db.query.mock.calls[1][0]).toMatch(/id=1/);
    done();
  }, 100);
});


// Negative tests

test('When bot finds appropriate rule to react, and random check is not successful, ' +
     'bot does not send anything', async done => {
  setMocks({ randomCheck: 0.99, reactions: oneTextReaction });
  const customReactions = require('./custom-reactions');
  const sender = require('../vk');
  const db = require('../db');
  await customReactions(messageWithAppropriatePhrase);
  setTimeout(() => {
    expect(db.query.mock.calls[0][0]).toMatch(/appropriate phrase/);
    expect(sender.sendMessage).not.toHaveBeenCalled();
    done();
  }, 100);
});

test('When bot finds appropriate rule to react, and random check is not successful, ' +
     'bot increases additional probability for that rule', async done => {
  setMocks({ randomCheck: 0.99, reactions: oneTextReaction });
  const customReactions = require('./custom-reactions');
  const db = require('../db');
  await customReactions(messageWithAppropriatePhrase);
  setTimeout(() => {
    expect(db.query.mock.calls[1][0]).toMatch(/additional_probability=5/);
    expect(db.query.mock.calls[1][0]).toMatch(/id=1/);
    done();
  }, 100);
});

test('When bot finds appropriate rule to react, and random check is not successful, and rule has non-zero additional probability' +
     'bot increases additional probability for that rule', async done => {
  setMocks({ randomCheck: 0.99, reactions: oneTextReactionWithAdditionalProbability });
  const customReactions = require('./custom-reactions');
  const db = require('../db');
  await customReactions(messageWithAppropriatePhrase);
  setTimeout(() => {
    expect(db.query.mock.calls[1][0]).toMatch(/additional_probability=25/);
    expect(db.query.mock.calls[1][0]).toMatch(/id=1/);
    done();
  }, 100);
});

test('When bot finds appropriate rule to react, and random check is not successful, ' +
     'bot passes incoming message further', async () => {
  setMocks({ randomCheck: 0.99, reactions: oneTextReaction });
  const customReactions = require('./custom-reactions');
  const result = await customReactions(messageWithAppropriatePhrase);
  expect(result).toBe(false);
});

test('When bot does not find a rule to react, bot does not send anything', async done => {
  setMocks({ randomCheck: 0.001, reactions: [] });
  const customReactions = require('./custom-reactions');
  const sender = require('../vk');
  const db = require('../db');
  await customReactions(messageWithAppropriatePhrase);
  setTimeout(() => {
    expect(db.query).toHaveBeenCalledTimes(1);
    expect(db.query.mock.calls[0][0]).toMatch(/appropriate phrase/);
    expect(sender.sendMessage).not.toHaveBeenCalled();
    done();
  }, 100);
});

test('When bot does not find a rule to react, bot passes incoming message further', async () => {
  setMocks({ randomCheck: 0.001, reactions: [] });
  const customReactions = require('./custom-reactions');
  const result = await customReactions(messageWithAppropriatePhrase);
  expect(result).toBe(false);
});


// Mixed case

test('When bot finds appropriate rule to react, and random check is successful only for some rules, ' +
     'bot resets additional probability only for rules that succeeded random check', async done => {
  setMocks({ randomCheck: 0.5, reactions: mixedSuccessfulAndFailedRandomCheck });
  const customReactions = require('./custom-reactions');
  const db = require('../db');
  await customReactions(messageWithAppropriatePhrase);
  setTimeout(() => {
    expect(db.query.mock.calls[2][0]).toMatch(/additional_probability=0/);
    expect(db.query.mock.calls[2][0]).toMatch(/id=1/);
    expect(db.query.mock.calls[2][0]).toMatch(/id=2/);
    expect(db.query.mock.calls[2][0]).not.toMatch(/id=3/);
    expect(db.query.mock.calls[2][0]).not.toMatch(/id=4/);
    done();
  }, 100);
});

test('When bot finds appropriate rule to react, and random check is successful only for some rules, ' +
     'bot increases additional probability only for rules that failed random check', async done => {
  setMocks({ randomCheck: 0.5, reactions: mixedSuccessfulAndFailedRandomCheck });
  const customReactions = require('./custom-reactions');
  const db = require('../db');
  await customReactions(messageWithAppropriatePhrase);
  setTimeout(() => {
    expect(db.query.mock.calls[1][0]).toMatch(/additional_probability=5 WHERE id=3/);
    expect(db.query.mock.calls[1][0]).toMatch(/additional_probability=10 WHERE id=4/);
    expect(db.query.mock.calls[1][0]).not.toMatch(/id=1/);
    expect(db.query.mock.calls[1][0]).not.toMatch(/id=2/);
    done();
  }, 100);
});


// Different reactions types

// Bot can send a text as a reaction - checked earlier

test('Bot can send a picture as a reaction', async done => {
  setMocks({ randomCheck: 0.001, reactions: onePictureReaction });
  const customReactions = require('./custom-reactions');
  const sender = require('../vk');
  await customReactions(messageWithAppropriatePhrase);
  setTimeout(() => {
    expect(sender.sendPhotoToChat).toHaveBeenCalledTimes(1);
    const imgBuffer = sender.sendPhotoToChat.mock.calls[0][0];
    expect(imgBuffer.length).toBe(12598);
    done();
  }, 4000);
});

test('Bot can send a YouTube video as a reaction', async done => {
  setMocks({ randomCheck: 0.001, reactions: oneYouTubeVideoReaction });
  const customReactions = require('./custom-reactions');
  const sender = require('../vk');
  await customReactions(messageWithAppropriatePhrase);
  setTimeout(() => {
    expect(sender.sendYouTubeVideo).toHaveBeenCalledTimes(1);
    expect(sender.sendYouTubeVideo).toHaveBeenCalledWith('TU-xo3Pe2_c');
    done();
  }, 100);
});

test('Bot can send a sticker as a reaction', async done => {
  setMocks({ randomCheck: 0.001, reactions: oneStickerReaction });
  const customReactions = require('./custom-reactions');
  const sender = require('../vk');
  await customReactions(messageWithAppropriatePhrase);
  setTimeout(() => {
    expect(sender.sendSticker).toHaveBeenCalledTimes(1);
    expect(sender.sendSticker).toHaveBeenCalledWith('1234');
    done();
  }, 100);
});


function setMocks(options) {
  const sender = require('../vk');
  sender.sendMessage = jest.fn().mockResolvedValue('ok');
  sender.sendPhotoToChat = jest.fn().mockResolvedValue('ok');
  sender.sendSticker = jest.fn().mockResolvedValue('ok');
  sender.sendYouTubeVideo = jest.fn().mockResolvedValue('ok');

  jest.doMock('../db');
  const db = require('../db');
  db.query.mockImplementation(_query => {
    if (_query.includes('SELECT')) {
      return Promise.resolve({ rows: options.reactions });
    }
  });

  jest.spyOn(global.Math, 'random').mockReturnValue(options.randomCheck);
}
