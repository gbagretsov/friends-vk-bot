const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res) => {

  try {
    const r = await db.query('SELECT * FROM friends_vk_bot.words ORDER BY id DESC;');
    let words = r.rows;
    res.json(words.map(word => {
      return {
        id: word.id,
        name: word.name,
        isApproved: word.approved,
      };
    }));
  } catch(error) {
    console.log(error);
    res.json({ error: 'internal' });
  }
});

router.post('/', async (req, res) => {

  let name = req.body.name;

  if (req.body.demo) {
    res.json({
      success: true,
      word: { id: Math.floor(Math.random() * 1000000), name, isApproved: true },
    });
    return;
  }

  // TODO: валидация

  try {
    const r = await db.query(`INSERT INTO friends_vk_bot.words (name) VALUES ('${ name }') RETURNING id;`);
    let id = r.rows[0].id;
    let word = { id, name, isApproved: true };
    res.json({ success: true, word });
  } catch(error) {
    console.log(error);
    res.json({ error: error.code === '23505' ? 'duplicate' : 'internal' });
  }
});

router.post('/:id', async (req, res) => {

  if (req.body.demo) {
    res.json({ success: true });
    return;
  }

  let id = req.params.id;
  let name = req.body.name;

  try {
    await db.query(`UPDATE friends_vk_bot.words SET name='${name}' WHERE id=${id};`);
    res.json({ success: true });
  } catch(error) {
    console.log(error);
    res.json({ error: 'internal' });
  }

});

router.post('/:id/approve', async (req, res) => {

  if (req.body.demo) {
    res.json({ success: true });
    return;
  }

  let id = req.params.id;

  try {
    await db.query(`UPDATE friends_vk_bot.words SET approved=true WHERE id=${id};`);
    res.json({ success: true });
  } catch(error) {
    console.log(error);
    res.json({ error: 'internal' });
  }

});

router.delete('/:id', async (req, res) => {

  if (req.body.demo) {
    res.json({ success: true });
    return;
  }

  let id = req.params.id;

  try {
    await db.query(`DELETE FROM friends_vk_bot.words WHERE id=${id};`);
    res.json({ success: true });
  } catch(error) {
    console.log(error);
    res.json({ error: 'internal' });
  }

});

module.exports.router = router;
