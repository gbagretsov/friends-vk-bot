const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res) => {
  const client = db();

  try {
    let r = await client.query("SELECT value FROM friends_vk_bot.state WHERE key = 'ads';");
    let ads = r.rows[0].value;
    res.json({ ads });
  } catch(error) {
    console.log(error);
    res.json({ error: 'internal' });
  } finally {
    client.end();
  }
});

router.post('/', async (req, res) => {
  let newAds = req.body.ads;
  let query = `
    UPDATE friends_vk_bot.state SET value = '${ newAds }' WHERE key = 'ads';
  `;

  const client = db();
  try {
    await client.query(query);
    res.json({ success: true });
  } catch(error) {
    console.log(error);
    res.json({ error: 'internal' });
  } finally {
    client.end();
  }
});

module.exports.router = router;