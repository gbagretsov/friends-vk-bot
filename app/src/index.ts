import express from 'express';
import bodyParser from 'body-parser';

import {handleMessage, handleActionWithMessage, handleReaction} from './receiver/receiver';
import {router as apiRouter} from './api/api';
import vk from './vk/vk';
import {VkActionWithMessageEvent} from './vk/model/events/VkActionWithMessageEvent';
import {VkMessageNewEvent} from './vk/model/events/VkMessageNewEvent';
import {update} from 'cheerio/lib/parse';
import {VkMessageReactionEvent} from './vk/model/events/VkMessageReactionEvent';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.static('compiled/public'));
app.use(bodyParser.json());

app.use('/api', apiRouter);

vk.startLongPoll(async (updates) => {
  for (let i = 0; i < updates.length; i++) {
    if (updates[i].type === 'message_new') {
      await handleMessage((updates[i] as VkMessageNewEvent).object.message);
    }
    if (updates[i].type === 'message_event') {
      await handleActionWithMessage((updates[i] as VkActionWithMessageEvent).object);
    }
    if (updates[i].type === 'message_reaction_event') {
      await handleReaction((updates[i] as VkMessageReactionEvent).object);
    }
  }
});

app.listen(PORT, () => console.log(`Listening on ${ PORT }`));
