import express from 'express';
import bodyParser from 'body-parser';

import receiver from './receiver/receiver';
import {router as apiRouter} from './api/api';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.static('compiled/public'));
app.use(bodyParser.json());

receiver(app);

app.use('/api', apiRouter);

app.listen(PORT, () => console.log(`Listening on ${ PORT }`));
