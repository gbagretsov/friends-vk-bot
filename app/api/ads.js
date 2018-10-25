const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
  const client = db();

  client.query("SELECT value FROM friends_vk_bot.state WHERE key = 'ads';")
  .then(r => {
    ads = r.rows[0].value;
    res.json({ ads });
  })
  .catch(error => {
    console.log(error);
    res.json({ error: 'internal' });
  })
  .then(() => client.end());
});

router.post('/', (req, res) => {
  let newAds = req.body.ads;
  let query = `
    UPDATE friends_vk_bot.state SET value = '${ newAds }' WHERE key = 'ads';
  `;

  const client = db();
  client.query(query)
  .then(() => res.json({ success: true }))
  .catch(error => {
    console.log(error);
    res.json({ error: 'internal' });
  })
  .then(() => client.end());
});

module.exports.router = router;