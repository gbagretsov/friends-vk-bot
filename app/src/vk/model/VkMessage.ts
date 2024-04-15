import {VkPoll} from './VkPoll';
import {VkPhoto} from './VkPhoto';

export type VkMessage = {
  from_id: number;
  peer_id: number;
  conversation_message_id: number;
  text: string;
  attachments: VkMessageAttachment[];
}

export type VkMessageAttachment =
  VkMessageStickerAttachment |
  VkMessageAudioMessageAttachment |
  VkMessageWallAttachment |
  VkMessagePollAttachment |
  VkMessagePhotoAttachment;

export type VkMessageStickerAttachment = {
  type: VkMessageAttachmentType.STICKER;
  sticker: {
    sticker_id: number;
  }
}

export type VkMessageAudioMessageAttachment = {
  type: VkMessageAttachmentType.AUDIO_MESSAGE;
  audio_message: {
    link_mp3: string;
  }
}

export type VkMessageWallAttachment = {
  type: VkMessageAttachmentType.WALL;
  wall: {
    attachments: VkMessageAttachment[];
  }
}

export type VkMessagePollAttachment = {
  type: VkMessageAttachmentType.POLL;
  poll: VkPoll;
}


export type VkMessagePhotoAttachment = {
  type: VkMessageAttachmentType.PHOTO;
  photo: VkPhoto;
}

export enum VkMessageAttachmentType {
  STICKER = 'sticker',
  AUDIO_MESSAGE = 'audio_message',
  WALL = 'wall',
  POLL = 'poll',
  PHOTO = 'photo',
}
