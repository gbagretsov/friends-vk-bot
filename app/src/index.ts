import express from 'express';
import bodyParser from 'body-parser';

import handleMessage from './receiver/receiver';
import {router as apiRouter} from './api/api';
import vk from './vk/vk';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.static('compiled/public'));
app.use(bodyParser.json());

app.use('/api', apiRouter);

vk.startLongPoll(async (updates) => {
  for (let i = 0; i < updates.length; i++) {
    if (!updates[i].object?.message) {
      continue;
    }
    await handleMessage(updates[i].object.message);
  }
});

app.listen(PORT, () => console.log(`Listening on ${ PORT }`));
