import {VkMessage} from '../../vk/model/VkMessage';

export const messageWithPublicPoll = {
  attachments: [{
    type: 'poll',
    poll: {
      id: 100000123,
      owner_id: 321,
      anonymous: false,
    }
  }]
} as VkMessage;

export const messageWithAnonymousePoll = {
  attachments: [{
    type: 'poll',
    poll: {
      id: 100000123,
      owner_id: 321,
      anonymous: true,
    }
  }]
} as VkMessage;

export const messageWithoutPoll = {
  attachments: [],
  from_id: 1,
  peer_id: 1,
  conversation_message_id: 1,
  text: ''
} as VkMessage;
