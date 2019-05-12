const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res) => {

  const client = db();
  
  try {
    const r = await client.query('SELECT * FROM friends_vk_bot.words ORDER BY id DESC;');
    let words = r.rows;
    res.json(words);
  } catch(error) {
    console.log(error);
    res.json({ error: 'internal' });
  } finally {
    client.end();
  }
});

router.post('/', async (req, res) => {

  const client = db();

  let name = req.body.name;
  // TODO: валидация

  try {
    const r = await client.query(`INSERT INTO friends_vk_bot.words (name) VALUES ('${ name }') RETURNING id;`);
    let id = r.rows[0].id;
    let word = { id, name };
    res.json({ success: true, word });
  } catch(error) {
    console.log(error);
    res.json({ error: error.code == 23505 ? 'duplicate' : 'internal' });
  } finally {
    client.end();
  }
});

router.post('/:id', async (req, res) => {

  const client = db();

  let id = req.params.id;
  let name = req.body.name;

  try {
    await client.query(`UPDATE friends_vk_bot.words SET name='${name}' WHERE id=${id};`);
    res.json({ success: true });
  } catch(error) {
    console.log(error);
    res.json({ error: 'internal' });
  } finally {
    client.end();
  }

});

router.delete('/:id', async (req, res) => {

  const client = db();

  let id = req.params.id;

  try {
    await client.query(`DELETE FROM friends_vk_bot.words WHERE id=${id};`);
    res.json({ success: true });
  } catch(error) {
    console.log(error);
    res.json({ error: 'internal' });
  } finally {
    client.end();
  }

});

module.exports.router = router;