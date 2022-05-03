import {VkMessage} from './VkMessage';

type VkConfirmationEvent = {
  type: 'confirmation',
  group_id: number,
}

type VkMessageNewEvent = {
  type: 'message_new',
  group_id: number,
  object: {
    message: VkMessage
  }
}

export type VkEvent = VkConfirmationEvent | VkMessageNewEvent;
