import {config} from 'dotenv';
config();

import {VkMessageHandler} from './model/VkMessageHandler';

import handleByGameModule from '../game/game';
import handleByChatModule from '../chat/chat';
import handleBySpeechModule from '../speech/speech';
import { handleLookForPollInIncomingMessage as handleByPollsWatchModule } from '../polls-watch/polls-watch';
import handleByCustomReactionsModule from '../custom-reactions/custom-reactions';
import handleByStatisticsModule from '../statistics/statistics';
import handleByMemesModule from '../memes/memes';
import {VkMessage} from '../vk/model/VkMessage';

const peerID = process.env.VK_PEER_ID.toString();

const handledMessages = new Set<number>();

export default async function (message: VkMessage) {

  if (peerID !== message.peer_id.toString()) {
    console.log(`Message #${message.conversation_message_id} "${message.text}" is not for me`);
    return;
  }

  if (handledMessages.has(message.conversation_message_id)) {
    console.log(`Skip handling of message #${message.conversation_message_id} "${message.text}" since it has already been handled`);
    return;
  }

  handledMessages.add(message.conversation_message_id);

  console.log(`Handling message: #${message.conversation_message_id} "${message.text}"`);

  // Если сообщение не распознано модулем, передаём его дальше по цепочке.
  // Таким образом, появляется возможность обрабатывать различные сценарии.

  const messageHandlers: VkMessageHandler[] = [
    handleByStatisticsModule,
    handleByGameModule,
    handleBySpeechModule,
    handleByPollsWatchModule,
    handleByMemesModule,
    handleByCustomReactionsModule,
    handleByChatModule,
  ];

  let handled = false;
  for (const handler of messageHandlers) {
    if (!handled) {
      handled = await handler(message);
    }
  }

  if (!handled) {
    console.log(`I did not understand message #${message.conversation_message_id} "${message.text}"`);
  }

}
