import {VkMessage} from '../VkMessage';

export type VkMessageNewEvent = {
  type: 'message_new',
  group_id: number,
  object: {
    message: VkMessage
  }
}
