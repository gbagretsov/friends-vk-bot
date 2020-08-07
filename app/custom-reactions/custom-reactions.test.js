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
    probability: 50,
    type: 1,
    content: 'This is custom reaction'
  },
];

const twoTextReactions = [
  {
    probability: 50,
    type: 1,
    content: 'This is custom reaction 1'
  },
  {
    probability: 50,
    type: 1,
    content: 'This is custom reaction 2'
  },
];

const onePictureReaction = [
  {
    probability: 50,
    type: 2,
    content: 'https://i.ytimg.com/vi/OCO3qYvqQ8w/hqdefault.jpg'
  },
];

const oneYouTubeVideoReaction = [
  {
    probability: 50,
    type: 3,
    content: 'TU-xo3Pe2_c'
  },
];

const oneStickerReaction = [
  {
    probability: 50,
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
    expect(db.query).toHaveBeenCalledTimes(1);
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
    expect(db.query).toHaveBeenCalledTimes(1);
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


// Negative tests

test('When bot finds appropriate rule to react, and random check is not successful, ' +
     'bot does not send anything', async done => {
  setMocks({ randomCheck: 0.99, reactions: oneTextReaction });
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


// Different reactions types

// Bot can send a text as a reaction - checked earlier

test('Bot can send a picture as a reaction', async done => {
  setMocks({ randomCheck: 0.001, reactions: onePictureReaction });
  const customReactions = require('./custom-reactions');
  const sender = require('../vk');
  await customReactions(messageWithAppropriatePhrase);
  setTimeout(() => {
    expect(sender.sendPhoto).toHaveBeenCalledTimes(1);
    const imgBuffer = sender.sendPhoto.mock.calls[0][0];
    expect(imgBuffer.length).toBe(12598);
    done();
  }, 500);
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
  jest.doMock('../vk');
  const sender = require('../vk');
  sender.sendMessage.mockResolvedValue('ok');
  sender.sendPhoto.mockResolvedValue('ok');
  sender.sendSticker.mockResolvedValue('ok');
  sender.sendYouTubeVideo.mockResolvedValue('ok');

  jest.doMock('../db');
  const db = require('../db');
  db.query.mockImplementation(_query => {
    if (_query.includes('SELECT')) {
      return Promise.resolve({ rows: options.reactions });
    }
  });

  jest.spyOn(global.Math, 'random').mockReturnValue(options.randomCheck);
}
