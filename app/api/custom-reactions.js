const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res) => {
  try {
    const r = await db.query('SELECT * FROM friends_vk_bot.custom_reactions ORDER BY id;');
    const customReactions = r.rows;
    res.json(customReactions);
  } catch(error) {
    console.log(error);
    res.json({ error: 'internal' });
  }
});

router.get('/:id', async (req, res) => {
  const id = req.params.id;
  try {
    let response = await db.query(`SELECT * FROM friends_vk_bot.custom_reactions WHERE id = ${id};`);
    const customReaction = response.rows[0];
    response = await db.query(`SELECT * FROM friends_vk_bot.phrases WHERE reaction_id = ${id} ORDER BY id;`);
    customReaction.phrases = response.rows.map(phrase => {
      return {
        id: phrase.id,
        text: phrase.text
      };
    });
    response = await db.query(`SELECT * FROM friends_vk_bot.stickers WHERE reaction_id = ${id} ORDER BY id;`);
    customReaction.stickers = response.rows.map(sticker => sticker.id);
    response = await db.query(`SELECT * FROM friends_vk_bot.responses WHERE reaction_id = ${id} ORDER BY id;`);
    customReaction.responses = response.rows.map(response => {
      return {
        id: response.id,
        type: response.type,
        content: response.content
      };
    });
    res.json(customReaction);
  } catch(error) {
    console.log(error);
    res.json({ error: 'internal' });
  }
});

module.exports.router = router;
