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
    customReaction.stickers = response.rows.map(sticker => {
      return {
        id: sticker.id,
        stickerId: sticker.sticker_id,
      };
    });
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

router.post('/', async (req, res) => {
  if (req.body.demo) {
    res.json({ success: true, id: Math.floor(Math.random() * 1000000) });
    return;
  }

  const { name, probability, phrases, stickers, responses } = req.body.reaction;

  const r = await db.query(`INSERT INTO friends_vk_bot.custom_reactions (name, probability) VALUES ('${name}', ${probability}) RETURNING id;`);
  const reactionId = r.rows[0].id;

  let query = 'BEGIN TRANSACTION;\n';
  query += getQueryForReactionUpdate(reactionId, phrases, stickers, responses);
  query += 'COMMIT';

  try {
    await db.query(query);
    res.json({ success: true, id: reactionId });
  } catch(error) {
    console.log(error);
    res.json({ error: 'internal' });
  }
});

router.post('/:id', async (req, res) => {
  if (req.body.demo) {
    res.json({ success: true });
    return;
  }

  const reactionId = req.params.id;
  const { name, probability, phrases, stickers, responses } = req.body.reaction;

  let query = 'BEGIN TRANSACTION;\n';
  query += `UPDATE friends_vk_bot.custom_reactions SET name='${name}', probability=${probability} WHERE id=${reactionId};\n`;
  query += getQueryForReactionUpdate(reactionId, phrases, stickers, responses);
  query += 'COMMIT';

  try {
    await db.query(query);
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

  const reactionId = req.params.id;
  const query = `DELETE FROM friends_vk_bot.custom_reactions WHERE id=${reactionId};`;

  try {
    await db.query(query);
    res.json({ success: true });
  } catch(error) {
    console.log(error);
    res.json({ error: 'internal' });
  }
});

function getQueryForReactionUpdate(reactionId, phrases, stickers, responses) {
  let query = '';

  phrases.forEach(phrase => {
    if (phrase.id) {
      if (phrase.deleted) {
        query += `DELETE FROM friends_vk_bot.phrases WHERE id=${phrase.id};\n`;
      } else {
        query += `UPDATE friends_vk_bot.phrases SET text='${phrase.text}' WHERE id=${phrase.id};\n`;
      }
    } else {
      query += `INSERT INTO friends_vk_bot.phrases (text, reaction_id) VALUES ('${phrase.text}', ${reactionId});\n`;
    }
  });

  stickers.forEach(sticker => {
    if (sticker.id) {
      if (sticker.deleted) {
        query += `DELETE FROM friends_vk_bot.stickers WHERE id=${sticker.id};\n`;
      } else {
        query += `UPDATE friends_vk_bot.stickers SET sticker_id=${sticker.stickerId} WHERE id=${sticker.id};\n`;
      }
    } else {
      query += `INSERT INTO friends_vk_bot.stickers (sticker_id, reaction_id) VALUES ('${sticker.stickerId}', ${reactionId});\n`;
    }
  });

  responses.forEach(response => {
    if (response.id) {
      if (response.deleted) {
        query += `DELETE FROM friends_vk_bot.responses WHERE id=${response.id};\n`;
      } else {
        query += `UPDATE friends_vk_bot.responses SET type=${response.type}, content='${response.content}' WHERE id=${response.id};\n`;
      }
    } else {
      query += `INSERT INTO friends_vk_bot.responses (type, content, reaction_id) VALUES ('${response.type}', '${response.content}', ${reactionId});\n`;
    }
  });
  return query;
}

module.exports.router = router;
