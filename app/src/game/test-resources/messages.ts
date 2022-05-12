import {VkMessage} from '../../vk/model/VkMessage';

export const messageWithGameRequest: VkMessage = {
  text: 'Бот, давай играть'
} as VkMessage;

export const messageWithCorrectAnswer: VkMessage = {
  text: 'абракадабра',
  from_id: 1,
} as VkMessage;

export const messageWithCorrectAnswerInUppercase: VkMessage = {
  text: 'АБРАКАДАБРА',
  from_id: 1,
} as VkMessage;

export const messageWithIncorrectAnswer: VkMessage = {
  text: 'Попытка'
} as VkMessage;

export const commonMessageWithBotMention: VkMessage = {
  text: 'Бот, привет'
} as VkMessage;

export const messageWithoutText: VkMessage = {
  text: ''
} as VkMessage;

export const messageWithAddWordRequest: VkMessage = {
  text: 'Бот, запомни слово покемон'
} as VkMessage;

export const messageWithDeleteWordRequest: VkMessage = {
  text: 'Бот, забудь слово покемон'
} as VkMessage;
