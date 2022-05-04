import {VkMessage, VkMessageAttachmentType} from '../../vk/model/VkMessage';

export const messageWithAppropriatePhrase: VkMessage = {
  text: 'appropriate phrase',
  attachments: [{}]
} as VkMessage;

export const messageWithAppropriateSticker: VkMessage = {
  text: '',
  attachments: [{
    type: VkMessageAttachmentType.STICKER,
    sticker: {
      sticker_id: 1337
    }
  }]
} as VkMessage;
