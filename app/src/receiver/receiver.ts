import {config} from 'dotenv';
config();

import {Express, Response, Request} from 'express';

import {VkEvent} from '../vk/VkEvent';
import {VkMessageHandler} from './VkMessageHandler';

import handleByGameModule from '../game/game';
import handleByChatModule from '../chat/chat';
import handleBySpeechModule from '../speech/speech';
import { handleLookForPollInIncomingMessage as handleByPollsWatchModule } from '../polls-watch/polls-watch';
import handleByCustomReactionsModule from '../custom-reactions/custom-reactions';
import { handleMessage as handleByStatisticsModule } from '../statistics/statistics';

const peerID = process.env.VK_PEER_ID.toString();

export default function (app: Express) {

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
        console.log(`Got message: ${message.text}`);

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
          console.log('I didn\'t understand this message :(');
        }

      } else {
        console.log('This message is not for me');
      }

      return;
    }

    res.status(404).end();
  });
}
