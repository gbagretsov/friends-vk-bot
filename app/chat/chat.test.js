const sender = require('../vk');
require('dotenv').config();

jest.mock('../vk');
sender.sendMessage.mockResolvedValue('ok');
sender.getUserName.mockImplementation(id => id === 1 ? Promise.resolve('Павел') : Promise.resolve('Марк'));

const chat = require('./chat');

afterEach(() => {
  jest.clearAllMocks();
});

test('Bot can recognize a mention to it in natural language at the beginning of incoming message', () => {
  const incomingMessagesToCheck = [
    { text: 'Бот, привет' },
    { text: 'бот, привет' },
    { text: 'БОТ, ПРИВЕТ' },
    { text: 'Бот,привет' },
    { text: 'Бот,' },
  ];
  incomingMessagesToCheck.forEach(message => expect(chat(message)).toBe(true));
});

test('Bot can recognize a mention to it with @ symbol anywhere in incoming message', () => {
  const atMention = `[club${process.env.VK_GROUP_ID}|@${process.env.VK_GROUP_SCREEN_NAME}]`;
  const incomingMessagesToCheck = [
    { text: `Привет, ${atMention}` },
    { text: `Привет, ${atMention}, ответь`, },
    { text: `${atMention}, ответь` },
  ];
  incomingMessagesToCheck.forEach(message => expect(chat(message)).toBe(true));
});

test('When bot could not recognize a mention, it passes incoming message to further handlers', () => {
  const incomingMessagesToCheck = [
    { text: 'Сообщение' },
    { text: '' },
    { text: 'У нас есть бот' },
    { text: 'У нас есть бот, и мы очень рады' },
  ];
  incomingMessagesToCheck.forEach(message => expect(chat(message)).toBe(false));
});

test('When bot could not recognize a mention, it does not send any messages in response', done => {
  const incomingMessagesToCheck = [
    { text: 'Сообщение' },
    { text: '' },
    { text: 'У нас есть бот' },
    { text: 'У нас есть бот, и мы очень рады' },
  ];
  incomingMessagesToCheck.forEach(message => chat(message));
  setTimeout(() => {
    expect(sender.sendMessage).not.toBeCalled();
    done();
  }, 500);
});

test('When bot recognizes its mention, it sends exactly one message in response', done => {
  chat({ text: 'Бот, привет' });
  setTimeout(() => {
    expect(sender.sendMessage).toHaveBeenCalledTimes(1);
    done();
  }, 500);
});

test('When bot recognizes its mention, it sends a greeting message with correct name in response', done => {
  chat({ text: 'Бот, привет', from_id: 1 });
  setTimeout(() => {
    expect(sender.sendMessage.mock.calls[0][0]).toBe('Привет, Павел!');
    done();
  }, 10);
});
