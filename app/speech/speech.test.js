const messageWithAudioAttachment = {
  text: '',
  from_id: 123,
  attachments: [{
    type: 'audio_message',
    audio_message: {
      link_mp3: 'http://some.mp3'
    }
  }]
};

const messageWithoutAudioAttachment = {
  text: 'Common message'
};

const speechRecognizedBody = {
  results: [{
    alternatives: [{
      transcript: 'Расшифровка записи',
      confidence: 0.95
    }]
  }]
};

const speechNotRecognizedBody = {
  results: []
};

let audioMessageBufferResponseExample;

beforeAll(async () => {
  const needle = require('needle');
  audioMessageBufferResponseExample = await needle('get', 'https://www.mobilesringtones.com/static/p/ringtones/2017/10/02/15726/15726.mp3');

  jest.spyOn(global.Math, 'random').mockReturnValue(0.1);
});

afterEach(() => {
  jest.clearAllMocks();
  jest.resetModules();
});

test('When bot receives an audio message, it stops further handling of this message', () => {
  setMocks();
  const speech = require('./speech');
  expect(speech(messageWithAudioAttachment)).toBe(true);
});

test('When bot receives an audio message and text is recognized, bot sends exactly one message in response', done => {
  setMocks();
  const speech = require('./speech');
  const sender = require('../vk');
  speech(messageWithAudioAttachment);
  setTimeout(() => {
    expect(sender.sendMessage).toHaveBeenCalledTimes(1);
    done();
  }, 500);
});

test('When bot receives an audio message and text is recognized, bot sends a message with transcript and correctness value', done => {
  setMocks();
  const speech = require('./speech');
  const sender = require('../vk');
  speech(messageWithAudioAttachment);
  setTimeout(() => {
    expect(sender.sendMessage.mock.calls[0][0]).toMatch(/"Расшифровка записи"/);
    expect(sender.sendMessage.mock.calls[0][0]).toMatch(/95%/);
    done();
  }, 100);
});

test('When bot receives an audio message and text is recognized, bot sends a message considering sender\'s name and sex', done => {
  setMocks();
  const speech = require('./speech');
  const sender = require('../vk');
  speech(messageWithAudioAttachment);
  speech(messageWithAudioAttachment);
  setTimeout(() => {
    expect(sender.sendMessage.mock.calls[0][0]).toMatch(/Иван сказал:/);
    expect(sender.sendMessage.mock.calls[1][0]).toMatch(/Анна сказала:/);
    expect(sender.getUserInfo.mock.calls[0][0]).toBe(123);
    expect(sender.getUserInfo.mock.calls[1][0]).toBe(123);
    done();
  }, 100);
});

test('When bot receives an audio message and text is not recognized, bot does not send any messages', done => {
  setMocks(false);
  const speech = require('./speech');
  const sender = require('../vk');
  speech(messageWithAudioAttachment);
  setTimeout(() =>{
    expect(sender.sendMessage).not.toHaveBeenCalled();
    done();
  }, 500);
});

test('When bot receives a common message, it does not stop further handling of this message', () => {
  const speech = require('./speech');
  expect(speech(messageWithoutAudioAttachment)).toBe(false);
});

test('When bot receives a common message, it does not send any messages', done => {
  const speech = require('./speech');
  speech(messageWithoutAudioAttachment);
  const sender = require('../vk');
  setTimeout(() => {
    expect(sender.sendMessage).not.toHaveBeenCalled();
    done();
  }, 500);
});


function setMocks(textRecognized = true) {
  jest.doMock('needle', () => (method, url) => {
    if (url.includes('mp3')) {
      return Promise.resolve(audioMessageBufferResponseExample);
    } else if (url.includes('google')) {
      return Promise.resolve({ body: textRecognized ? speechRecognizedBody : speechNotRecognizedBody });
    }
  });
  jest.doMock('../vk');
  const sender = require('../vk');
  sender.sendMessage.mockResolvedValue('ok');
  sender.getUserInfo
    .mockResolvedValueOnce({ first_name: 'Иван', sex: 0 })
    .mockResolvedValueOnce({ first_name: 'Анна', sex: 1 });
}
