import express, {Request, Response} from 'express';
import {config} from 'dotenv';

import {router as customReactionsRouter} from './custom-reactions';
import {router as settingsRouter} from './settings';
import {router as wordsRouter} from './words';
import {ErrorType} from './model/ErrorType';

const router = express.Router();
config();

function checkToken(req: Request, res: Response, next: () => void): void {
  const receivedToken = req.body.token || req.query.token;
  const actualToken = process.env.VK_ACCESS_TOKEN;
  if (receivedToken === actualToken) {
    req.body.demo = false;
    next();
  } else if (receivedToken && receivedToken.toUpperCase() === 'DEMO') {
    req.body.demo = true;
    next();
  } else {
    res.json({ error: ErrorType.TOKEN });
  }
}

router.use(checkToken);

router.use('/words', wordsRouter);
router.use('/settings', settingsRouter);
router.use('/customReactions', customReactionsRouter);

router.post('/', (req, res) => {
  res.json({ success: true, demo: req.body.demo });
});

export { router };

