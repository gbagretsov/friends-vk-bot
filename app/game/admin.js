const express = require('express');
const db = require('../db');

function addWord(word) {
  let client = db();
  return client.query(`INSERT INTO friends_vk_bot.words (name) VALUES ('${ word }');`)
    .catch(error => {
      console.log(error);
      return error.code;
    })
    .then(result => {
      client.end();
      return result;
    });
}

function deleteWord(word) {
  let client = db();
  return client.query(`DELETE FROM friends_vk_bot.words WHERE name = '${ word }';`)
    .catch(error => console.log(error))
    .then(() => client.end());
}

module.exports.addWord = addWord;
module.exports.deleteWord = deleteWord;
