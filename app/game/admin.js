const db = require('../db');

async function addWord(word, approved = true) {
  try {
    return await db.query(`INSERT INTO friends_vk_bot.words (name, approved) VALUES ('${ word }', ${ approved });`);
  } catch (error) {
    console.log(error.detail);
    return error.code;
  }
}

async function deleteWord(word) {
  try {
    return await db.query(`DELETE FROM friends_vk_bot.words WHERE name = '${ word }';`);
  } catch (error) {
    console.log(error);
  }
}

module.exports.addWord = addWord;
module.exports.deleteWord = deleteWord;
