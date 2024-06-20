import {VkMessageNewEvent} from './VkMessageNewEvent';
import {VkActionWithMessageEvent} from './VkActionWithMessageEvent';
import {VkMessageReactionEvent} from './VkMessageReactionEvent';

export type VkEvent = VkMessageNewEvent | VkActionWithMessageEvent | VkMessageReactionEvent;
