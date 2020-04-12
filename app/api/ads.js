const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res) => {

  try {
    let r = await db.query('SELECT value FROM friends_vk_bot.state WHERE key = \'ads\';');
    let ads = r.rows[0].value;
    res.json({ ads });
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
  let query = `
    UPDATE friends_vk_bot.state SET value = '${ newAds }' WHERE key = 'ads';
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
