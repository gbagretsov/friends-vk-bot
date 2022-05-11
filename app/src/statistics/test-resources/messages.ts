import {VkMessage} from '../../vk/model/VkMessage';

export const textMessage: VkMessage = {
  text: 'Hello',
  from_id: 1111,
  peer_id: -20001,
  conversation_message_id: 1,
  attachments: [],
} as VkMessage;

export const stickerMessage: VkMessage = {
  attachments: [{
    type: 'sticker',
    sticker: { sticker_id: 1 }
  }],
  from_id: 1111,
  conversation_message_id: 1
} as VkMessage;

export const audioMessage: VkMessage = {
  attachments: [{
    type: 'audio_message',
    audio_message: { link_mp3: 'link_mp3' }
  }],
  from_id: 2222,
  conversation_message_id: 1
} as VkMessage;

export const repostMessage: VkMessage = {
  attachments: [{
    type: 'wall',
  }],
  from_id: 1111,
  conversation_message_id: 1
} as VkMessage;
