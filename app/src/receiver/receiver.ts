import {config} from 'dotenv';
config();

import {Express, Response, Request} from 'express';

import {VkEvent} from '../vk/model/VkEvent';
import {VkMessageHandler} from './model/VkMessageHandler';

import handleByGameModule from '../game/game';
import handleByChatModule from '../chat/chat';
import handleBySpeechModule from '../speech/speech';
import { handleLookForPollInIncomingMessage as handleByPollsWatchModule } from '../polls-watch/polls-watch';
import handleByCustomReactionsModule from '../custom-reactions/custom-reactions';
import { handleMessage as handleByStatisticsModule } from '../statistics/statistics';

const peerID = process.env.VK_PEER_ID.toString();

export default function (app: Express) {

  const handledMessages = new Set<number>();

  app.post('/receive', async(req: Request<never, never, VkEvent, never, never>, res: Response) => {

    // Подтверждение адреса
    if (req.body.type === 'confirmation' && req.body.group_id.toString() === process.env.VK_GROUP_ID.toString()) {
      res.send(process.env.VK_CONFIRMATION_RESPONSE);
      return;
    }

    // Приём сообщений
    if (req.body.type === 'message_new') {
      res.send('ok');

      const message = req.body.object.message;

      if (peerID === message.peer_id.toString()) {

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

      } else {
        console.log(`Message #${message.conversation_message_id} "${message.text}" is not for me`);
      }

      return;
    }

    res.status(404).end();
  });
}
