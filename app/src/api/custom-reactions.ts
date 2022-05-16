import express from 'express';
import db from '../db';
import {ErrorType} from './model/ErrorType';
import {CustomReactionDto} from './model/custom-reactions-dto/CustomReactionDto';
import {CustomReactionPhraseDto} from './model/custom-reactions-dto/CustomReactionPhraseDto';
import {CustomReactionStickerDto} from './model/custom-reactions-dto/CustomReactionStickerDto';
import {CustomReactionResponseDto} from './model/custom-reactions-dto/CustomReactionResponseDto';
import {CustomReactionPhraseUpdate} from './model/custom-reactions-dto/CustomReactionPhraseUpdate';
import {CustomReactionResponseUpdate} from './model/custom-reactions-dto/CustomReactionResponseUpdate';
import {CustomReactionStickerUpdate} from './model/custom-reactions-dto/CustomReactionStickerUpdate';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const r = await db.query('SELECT id, name, base_probability AS probability FROM friends_vk_bot.custom_reactions ORDER BY id;');
    const customReactions = r.rows;
    res.json(customReactions);
  } catch(error) {
    console.log(error);
    res.json({ error: ErrorType.INTERNAL });
  }
});

router.get('/:id', async (req, res) => {
  const id = req.params.id;
  try {
    const customReactionDbResponse = await db.query<CustomReactionDto>(`SELECT id, name, base_probability AS probability FROM friends_vk_bot.custom_reactions WHERE id = ${id};`);
    const customReaction = customReactionDbResponse.rows[0];

    const phrasesDbResponse = await db.query<CustomReactionPhraseDto>(`SELECT * FROM friends_vk_bot.phrases WHERE reaction_id = ${id} ORDER BY id;`);
    customReaction.phrases = phrasesDbResponse.rows;

    const stickersDbResponse = await db.query<CustomReactionStickerDto>(`SELECT id, sticker_id AS "stickerId" FROM friends_vk_bot.stickers WHERE reaction_id = ${id} ORDER BY id;`);
    customReaction.stickers = stickersDbResponse.rows;

    const responsesDbResponse = await db.query<CustomReactionResponseDto>(`SELECT * FROM friends_vk_bot.responses WHERE reaction_id = ${id} ORDER BY id;`);
    customReaction.responses = responsesDbResponse.rows;

    res.json(customReaction);
  } catch(error) {
    console.log(error);
    res.json({ error: ErrorType.INTERNAL });
  }
});

router.post('/', async (req, res) => {
  if (req.body.demo) {
    res.json({ success: true, id: Math.floor(Math.random() * 1000000) });
    return;
  }

  const { name, probability, phrases, stickers, responses } = req.body.reaction;

  const r = await db.query<{id: number}>(`INSERT INTO friends_vk_bot.custom_reactions (name, base_probability) VALUES ('${name}', ${probability}) RETURNING id;`);
  const reactionId = r.rows[0].id;

  let query = 'BEGIN TRANSACTION;\n';
  query += getQueryForReactionUpdate(reactionId, phrases, stickers, responses);
  query += 'COMMIT';

  try {
    await db.query(query);
    res.json({ success: true, id: reactionId });
  } catch(error) {
    console.log(error);
    res.json({ error: ErrorType.INTERNAL });
  }
});

router.post('/:id', async (req, res) => {
  if (req.body.demo) {
    res.json({ success: true });
    return;
  }

  const reactionId = parseInt(req.params.id);
  const { name, probability, phrases, stickers, responses } = req.body.reaction;

  let query = 'BEGIN TRANSACTION;\n';
  query += `UPDATE friends_vk_bot.custom_reactions SET name='${name}', base_probability=${probability} WHERE id=${reactionId};\n`;
  query += getQueryForReactionUpdate(reactionId, phrases, stickers, responses);
  query += 'COMMIT';

  try {
    await db.query(query);
    res.json({ success: true });
  } catch(error) {
    console.log(error);
    res.json({ error: ErrorType.INTERNAL });
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

function getQueryForReactionUpdate(reactionId: number, phrases: CustomReactionPhraseUpdate[],
  stickers: CustomReactionStickerUpdate[], responses: CustomReactionResponseUpdate[]): string {
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

export { router };
