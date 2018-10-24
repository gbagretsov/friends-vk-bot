const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {

  const client = db();

  client.query('SELECT * FROM friends_vk_bot.words;')
    .then(r => {
      let words = r.rows;
      res.json(words);
    })
    .catch(error => {
      console.log(error);
      res.json({ error: 'internal' });
    })
    .then(() => client.end());
});

module.exports.router = router;