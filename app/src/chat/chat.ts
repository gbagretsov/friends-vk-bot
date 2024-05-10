import {config} from 'dotenv';
import vk from '../vk/vk';
import {VkMessage} from '../vk/model/VkMessage';

config();

export default function (message: VkMessage) {
  const text = message.text.toLowerCase();

  if (text.startsWith('бот,') || text.includes(`club${process.env.VK_GROUP_ID}`)) {
    const uid = message.from_id;
    vk.getUserName(uid).then(response => vk.sendMessage({
      text: `Привет, ${response}!`,
    }, 5000));
    return true;
  }

  return false;
}
