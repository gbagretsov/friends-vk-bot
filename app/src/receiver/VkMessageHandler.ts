import {VkMessage} from '../vk/VkMessage';

export type VkMessageHandler = (message: VkMessage) => (boolean | Promise<boolean>);
