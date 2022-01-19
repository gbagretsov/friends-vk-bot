const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res) => {

  try {
    const adsRow = await db.query('SELECT value FROM friends_vk_bot.state WHERE key = \'ads\';');
    const ads = adsRow.rows[0].value;
    const absentHolidaysPhrasesRow = await db.query('SELECT value FROM friends_vk_bot.state WHERE key = \'absent_holidays_phrases\';');
    const absentHolidaysPhrases = absentHolidaysPhrasesRow.rows[0].value;
    res.json({ ads, absentHolidaysPhrases });
  } catch(error) {
    console.log(error);
    res.json({ error: 'internal' });
  }
});

router.post('/', async (req, res) => {
  if (req.body.demo) {
    res.json({ success: true });
    return;
  }

  let newAds = req.body.ads;
  let newAbsentHolidaysPhrases = req.body.absentHolidaysPhrases;
  let query = `
    UPDATE friends_vk_bot.state SET value = '${ newAds }' WHERE key = 'ads';
    UPDATE friends_vk_bot.state SET value = '${ newAbsentHolidaysPhrases }' WHERE key = 'absent_holidays_phrases';
  `;

  try {
    await db.query(query);
    res.json({ success: true });
  } catch(error) {
    console.log(error);
    res.json({ error: 'internal' });
  }
});

module.exports.router = router;
