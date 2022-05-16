import express from 'express';
import db from '../db';
import {ErrorType} from './model/ErrorType';

const router = express.Router();

router.get('/', async (req, res) => {

  try {
    const stateRows = await db.query<{key: string; value: string}>('SELECT * FROM friends_vk_bot.state;');
    const ads = stateRows.rows.find(row => row.key === 'ads')!.value;
    const absentHolidaysPhrases = stateRows.rows.find(row => row.key === 'absent_holidays_phrases')!.value;
    res.json({ ads, absentHolidaysPhrases });
  } catch(error) {
    console.log(error);
    res.json({ error: ErrorType.INTERNAL });
  }
});

router.post('/', async (req, res) => {
  if (req.body.demo) {
    res.json({ success: true });
    return;
  }

  const newAds = req.body.ads;
  const newAbsentHolidaysPhrases = req.body.absentHolidaysPhrases;
  const query = `
    UPDATE friends_vk_bot.state SET value = '${ newAds }' WHERE key = 'ads';
    UPDATE friends_vk_bot.state SET value = '${ newAbsentHolidaysPhrases }' WHERE key = 'absent_holidays_phrases';
  `;

  try {
    await db.query(query);
    res.json({ success: true });
  } catch(error) {
    console.log(error);
    res.json({ error: ErrorType.INTERNAL });
  }
});

export { router };
