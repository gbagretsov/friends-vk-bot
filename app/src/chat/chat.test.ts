import {config} from 'dotenv';
import vk from '../vk/vk';
import chat from './chat';
import {VkMessage} from '../vk/model/VkMessage';

config();

jest.mock('../vk/vk');

const sendMessageSpy = jest.spyOn(vk, 'sendMessage').mockResolvedValue(true);
vk.getUserName = jest.fn().mockImplementation(id => Promise.resolve(id === 1 ? 'Павел' : 'Марк'));

describe('Chat', () => {

  test('Bot can recognize a mention to it in natural language at the beginning of incoming message', () => {
    const incomingMessagesToCheck = [
      { text: 'Бот, привет' },
      { text: 'бот, привет' },
      { text: 'БОТ, ПРИВЕТ' },
      { text: 'Бот,привет' },
      { text: 'Бот,' },
    ] as VkMessage[];
    incomingMessagesToCheck.forEach(message => expect(chat(message)).toBe(true));
  });

  test('Bot can recognize a mention to it with @ symbol anywhere in incoming message', () => {
    const atMention = `[club${process.env.VK_GROUP_ID}|@${process.env.VK_GROUP_SCREEN_NAME}]`;
    const incomingMessagesToCheck = [
      { text: `Привет, ${atMention}` },
      { text: `Привет, ${atMention}, ответь`, },
      { text: `${atMention}, ответь` },
    ] as VkMessage[];
    incomingMessagesToCheck.forEach(message => expect(chat(message)).toBe(true));
  });

  test('When bot could not recognize a mention, it passes incoming message to further handlers', () => {
    const incomingMessagesToCheck = [
      { text: 'Сообщение' },
      { text: '' },
      { text: 'У нас есть бот' },
      { text: 'У нас есть бот, и мы очень рады' },
    ] as VkMessage[];
    incomingMessagesToCheck.forEach(message => expect(chat(message)).toBe(false));
  });

  test('When bot could not recognize a mention, it does not send any messages in response', async () => {
    const incomingMessagesToCheck = [
      { text: 'Сообщение' },
      { text: '' },
      { text: 'У нас есть бот' },
      { text: 'У нас есть бот, и мы очень рады' },
    ] as VkMessage[];
    incomingMessagesToCheck.forEach(message => chat(message));
    await Promise.resolve();
    expect(sendMessageSpy).not.toBeCalled();
  });

  test('When bot recognizes its mention, it sends exactly one message in response', async () => {
    chat({ text: 'Бот, привет' } as VkMessage);
    await Promise.resolve();
    expect(sendMessageSpy).toHaveBeenCalledTimes(1);
  });

  test('When bot recognizes its mention, it sends a greeting message with correct name in response', async () => {
    chat({ text: 'Бот, привет', from_id: 1 } as VkMessage);
    await Promise.resolve();
    expect(sendMessageSpy.mock.calls[0][0]).toBe('Привет, Павел!');
  });
});
