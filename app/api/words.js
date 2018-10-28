const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {

  const client = db();

  client.query('SELECT * FROM friends_vk_bot.words ORDER BY id DESC;')
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

router.post('/:id', (req, res) => {

  const client = db();

  let id = req.params.id;
  let name = req.body.name;

  client.query(`UPDATE friends_vk_bot.words SET name='${name}' WHERE id=${id};`)
    .then(r => {
      res.json({ success: true });
    })
    .catch(error => {
      console.log(error);
      res.json({ error: 'internal' });
    })
    .then(() => client.end());
});

module.exports.router = router;