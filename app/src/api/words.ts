import express from 'express';
import db, {DUPLICATE_KEY_PG_ERROR} from '../db';
import {WordDto} from './model/words-dto/WordDto';
import {ErrorType} from './model/ErrorType';

const router = express.Router();
router.get('/', async (req, res) => {

  try {
    const r = await db.query<WordDto>('SELECT id, name, approved AS "isApproved" FROM friends_vk_bot.words ORDER BY id DESC;');
    res.json(r.rows);
  } catch(error) {
    console.log(error);
    res.json({ error: ErrorType.INTERNAL });
  }
});

router.post('/', async (req, res) => {

  const name = req.body.name as string;

  try {
    const r = await db.query<{id: number}>(`INSERT INTO friends_vk_bot.words (name) VALUES ('${ name }') RETURNING id;`);
    const id = r.rows[0].id;
    const word: WordDto = { id, name, isApproved: true };
    res.json({ success: true, word });
  } catch(error) {
    console.log(error);
    res.json({
      error: (error as any).code === DUPLICATE_KEY_PG_ERROR ?
        ErrorType.DUPLICATE :
        ErrorType.INTERNAL
    });
  }
});

router.post('/:id', async (req, res) => {

  const id = req.params.id;
  const name = req.body.name as string;

  try {
    await db.query(`UPDATE friends_vk_bot.words SET name='${name}' WHERE id=${id};`);
    res.json({ success: true });
  } catch(error) {
    console.log(error);
    res.json({ error: ErrorType.INTERNAL });
  }

});

router.post('/:id/approve', async (req, res) => {

  const id = req.params.id;

  try {
    await db.query(`UPDATE friends_vk_bot.words SET approved=true WHERE id=${id};`);
    res.json({ success: true });
  } catch(error) {
    console.log(error);
    res.json({ error: ErrorType.INTERNAL });
  }

});

router.delete('/:id', async (req, res) => {

  const id = req.params.id;

  try {
    await db.query(`DELETE FROM friends_vk_bot.words WHERE id=${id};`);
    res.json({ success: true });
  } catch(error) {
    console.log(error);
    res.json({ error: ErrorType.INTERNAL });
  }

});

export {router};
