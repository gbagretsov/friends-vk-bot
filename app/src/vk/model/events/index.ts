import {VkMessageNewEvent} from './VkMessageNewEvent';
import {VkActionWithMessageEvent} from './VkActionWithMessageEvent';

export type VkEvent = VkMessageNewEvent | VkActionWithMessageEvent;
