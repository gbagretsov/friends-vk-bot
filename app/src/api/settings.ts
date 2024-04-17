import express from 'express';
import db from '../db';
import {ErrorType} from './model/ErrorType';

const router = express.Router();

router.get('/', async (req, res) => {

  try {
    const stateRows = await db.query<{key: string; value: string}>('SELECT * FROM friends_vk_bot.state;');
    const ads = stateRows.rows.find(row => row.key === 'ads')!.value;
    const absentHolidaysPhrases = stateRows.rows.find(row => row.key === 'absent_holidays_phrases')!.value;
    const memesRecognitionConfidence = stateRows.rows.find(row => row.key === 'memes_recognition_confidence')!.value;
    res.json({ ads, absentHolidaysPhrases, memesRecognitionConfidence });
  } catch(error) {
    console.log(error);
    res.json({ error: ErrorType.INTERNAL });
  }
});

router.post('/', async (req, res) => {
  const { ads, absentHolidaysPhrases, memesRecognitionConfidence } = req.body;
  const query = `
    UPDATE friends_vk_bot.state SET value = '${ ads }' WHERE key = 'ads';
    UPDATE friends_vk_bot.state SET value = '${ absentHolidaysPhrases }' WHERE key = 'absent_holidays_phrases';
    UPDATE friends_vk_bot.state SET value = '${ memesRecognitionConfidence }' WHERE key = 'memes_recognition_confidence';
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
