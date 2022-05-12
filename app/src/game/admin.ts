import db, {DUPLICATE_KEY_PG_ERROR} from '../db';
import {AddWordResult} from './model/AddWordResult';

async function addWord(word: string, approved: boolean): Promise<AddWordResult> {
  try {
    await db.query(`INSERT INTO friends_vk_bot.words (name, approved) VALUES ('${ word }', ${ approved });`);
    return AddWordResult.SUCCESS;
  } catch (error) {
    return (error as any).code === DUPLICATE_KEY_PG_ERROR ? AddWordResult.DUPLICATE_WORD : AddWordResult.ERROR;
  }
}

async function deleteWord(word: string): Promise<void> {
  try {
    await db.query(`DELETE FROM friends_vk_bot.words WHERE name = '${ word }';`);
  } catch (error) {
    console.log(error);
  }
}

export default {
  deleteWord,
  addWord,
};
