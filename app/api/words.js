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

router.post('/', (req, res) => {

  const client = db();

  let name = req.body.name;
  // TODO: валидация

  client.query(`INSERT INTO friends_vk_bot.words (name) VALUES ('${ name }') RETURNING id;`)
    .then(r => {
      let id = r.rows[0].id;
      let word = { id, name };
      res.json({ success: true, word });
    })
    .catch(error => {
      console.log(error);
      res.json({ error: error.code == 23505 ? 'duplicate' : 'internal' });
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

router.delete('/:id', (req, res) => {

  const client = db();

  let id = req.params.id;

  client.query(`DELETE FROM friends_vk_bot.words WHERE id=${id};`)
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