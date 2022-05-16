import {VkMessage, VkMessageAttachmentType} from '../../vk/model/VkMessage';

export const messageWithAudioAttachmentFromMaleUser: VkMessage = {
  text: '',
  from_id: 123,
  attachments: [{
    type: VkMessageAttachmentType.AUDIO_MESSAGE,
    audio_message: {
      link_mp3: 'some.mp3'
    }
  }]
} as VkMessage;

export const messageWithAudioAttachmentFromFemaleUser: VkMessage = {
  text: '',
  from_id: 456,
  attachments: [{
    type: VkMessageAttachmentType.AUDIO_MESSAGE,
    audio_message: {
      link_mp3: 'some.mp3'
    }
  }]
} as VkMessage;

export const messageWithoutAudioAttachment: VkMessage = {
  text: 'Common message',
  attachments: [],
  from_id: 123,
  conversation_message_id: 1,
  peer_id: 1,
} as VkMessage;
