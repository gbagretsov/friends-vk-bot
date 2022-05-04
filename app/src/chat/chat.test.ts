import {config} from 'dotenv';
import vk from '../vk/vk';
import chat from './chat';
import * as testResources from './test-resources/messages';

config();

jest.mock('../vk/vk');

const sendMessageSpy = jest.spyOn(vk, 'sendMessage').mockResolvedValue(true);
vk.getUserName = jest.fn().mockImplementation(id => Promise.resolve(id === 1 ? 'Павел' : false));

describe('Chat', () => {

  test('Bot can recognize a mention to it in natural language at the beginning of incoming message', () => {
    testResources.messagesWithBotMentionInNaturalLanguageAtTheBeginning
      .forEach(message => expect(chat(message)).toBe(true));
  });

  test('Bot can recognize a mention to it with @ symbol anywhere in incoming message', () => {
    testResources.messagesWithBotMentionUsingAtNotation
      .forEach(message => expect(chat(message)).toBe(true));
  });

  test('When bot could not recognize a mention, it passes incoming message to further handlers', () => {
    testResources.messagesWithoutValidBotMention
      .forEach(message => expect(chat(message)).toBe(false));
  });

  test('When bot could not recognize a mention, it does not send any messages in response', async () => {
    testResources.messagesWithoutValidBotMention.forEach(message => chat(message));
    await Promise.resolve();
    expect(sendMessageSpy).not.toBeCalled();
  });

  test('When bot recognizes its mention, it sends exactly one message in response', async () => {
    chat(testResources.messagesWithBotMentionInNaturalLanguageAtTheBeginning[0]);
    await Promise.resolve();
    expect(sendMessageSpy).toHaveBeenCalledTimes(1);
  });

  test('When bot recognizes its mention, it sends a greeting message with correct name in response', async () => {
    chat(testResources.messagesWithBotMentionInNaturalLanguageAtTheBeginning[0]);
    await Promise.resolve();
    expect(sendMessageSpy.mock.calls[0][0]).toBe('Привет, Павел!');
  });
});
