import {VkMessage} from '../../vk/model/VkMessage';

function constructMessage(text: string): VkMessage {
  return { text, from_id: 1 } as VkMessage;
}

export const messagesWithBotMentionInNaturalLanguageAtTheBeginning: VkMessage[] = [
  constructMessage('Бот, привет'),
  constructMessage('бот, привет'),
  constructMessage('БОТ, ПРИВЕТ'),
  constructMessage('Бот,привет'),
  constructMessage('Бот,'),
];

const atMention = `[club${process.env.VK_GROUP_ID}|@${process.env.VK_GROUP_SCREEN_NAME}]`;
export const messagesWithBotMentionUsingAtNotation: VkMessage[] = [
  constructMessage(`Привет, ${atMention}`),
  constructMessage(`Привет, ${atMention}, ответь`),
  constructMessage(`${atMention}, ответь`),
];

export const messagesWithoutValidBotMention: VkMessage[] = [
  constructMessage('Сообщение'),
  constructMessage(''),
  constructMessage('У нас есть бот'),
  constructMessage('У нас есть бот, и мы очень рады'),
];
