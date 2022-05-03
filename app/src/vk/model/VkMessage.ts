import {VkPoll} from './VkPoll';

export type VkMessage = {
  peer_id: number,
  text: string,
  attachments: VkMessageAttachment[];
}

export type VkMessageAttachment =
  VkMessageStickerAttachment | VkMessageAudioMessageAttachment | VkMessageWallAttachment | VkMessagePollAttachment;

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
}

export type VkMessagePollAttachment = {
  type: VkMessageAttachmentType.POLL;
  poll: VkPoll;
}

export enum VkMessageAttachmentType {
  STICKER = 'sticker',
  AUDIO_MESSAGE = 'audio_message',
  WALL = 'wall',
  POLL = 'poll',
}
