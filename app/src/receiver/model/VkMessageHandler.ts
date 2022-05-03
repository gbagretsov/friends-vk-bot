import {VkMessage} from '../../vk/model/VkMessage';

export type VkMessageHandler = (message: VkMessage) => (boolean | Promise<boolean>);
