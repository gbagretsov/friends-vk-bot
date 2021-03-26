const statisticsConstants = require('./statistics-constants');
const db = require('../db');
const vk = require('../vk');

async function gatherStatistics(message) {
  const result = await db.query('SELECT * FROM friends_vk_bot.statistics');
  const rows = result.rows.map(row => {
    return {
      id: parseInt(row.id, 10),
      value: row.value
    };
  });
  let updateQuery = 'BEGIN TRANSACTION;\n';

  const totalCounter = rows.find(row => row.id === statisticsConstants.TOTAL_AMOUNT).value + 1;
  updateQuery += `UPDATE friends_vk_bot.statistics SET value = ${totalCounter} WHERE id = ${statisticsConstants.TOTAL_AMOUNT};\n`;

  const senderRow = rows.find(row => row.id === message.from_id);
  const senderCounter = senderRow ? senderRow.value + 1 : 1;
  if (senderRow) {
    updateQuery += `UPDATE friends_vk_bot.statistics SET value = ${senderCounter} WHERE id = ${message.from_id};\n`;
  } else {
    updateQuery += `INSERT INTO friends_vk_bot.statistics VALUES(${message.from_id}, ${senderCounter});\n`;
  }

  if (vk.getStickerId(message)) {
    const stickersCounter = rows.find(row => row.id === statisticsConstants.STICKERS_AMOUNT).value + 1;
    updateQuery += `UPDATE friends_vk_bot.statistics SET value = ${stickersCounter} WHERE id = ${statisticsConstants.STICKERS_AMOUNT};\n`;
  }

  if (vk.isAudioMessage(message)) {
    const audioMessagesCounter = rows.find(row => row.id === statisticsConstants.AUDIO_MESSAGES_AMOUNT).value + 1;
    updateQuery += `UPDATE friends_vk_bot.statistics SET value = ${audioMessagesCounter} WHERE id = ${statisticsConstants.AUDIO_MESSAGES_AMOUNT};\n`;
  }

  if (vk.isRepost(message)) {
    const repostsCounter = rows.find(row => row.id === statisticsConstants.REPOSTS_AMOUNT).value + 1;
    updateQuery += `UPDATE friends_vk_bot.statistics SET value = ${repostsCounter} WHERE id = ${statisticsConstants.REPOSTS_AMOUNT};\n`;
  }

  updateQuery += 'END TRANSACTION';
  db.query(updateQuery).catch(error => console.error(error));
}

module.exports.handleMessage = function(message) {
  db.query(
    `SELECT conversation_message_id
    FROM friends_vk_bot.handled_messages 
    WHERE conversation_message_id = ${message.conversation_message_id}`
  ).then(result => {
    if (result.rows[0] && result.rows[0].conversation_message_id === message.conversation_message_id) {
      console.log(`Skip handling of message ${message.text} as it has been already handled`);
      return false;
    }
    const saveMessageIdQuery = `INSERT INTO friends_vk_bot.handled_messages VALUES(${message.conversation_message_id});\n`;
    db.query(saveMessageIdQuery).catch(error => console.log(error));
    gatherStatistics(message);
  });
  return false;
};

module.exports.getStatistics = async function() {
  const result = await db.query('SELECT * FROM friends_vk_bot.statistics');
  const rows = result.rows.map(row => {
    return {
      id: parseInt(row.id, 10),
      value: parseInt(row.value),
    };
  });

  const previousMonthAmount = rows.find(row => row.id === statisticsConstants.PREVIOUS_MONTH_AMOUNT).value;

  const userRows = rows.filter(row => row.id > 0 && row.value > 0);
  const maxMessagesAmount = userRows.reduce((currentMax, currentRow) => currentRow.value > currentMax ? currentRow.value : currentMax, -1);
  const mostActiveUsers = userRows.filter(user => user.value === maxMessagesAmount).map(user => user.id);

  return {
    totalAmount: rows.find(row => row.id === statisticsConstants.TOTAL_AMOUNT).value,
    audioMessagesAmount: rows.find(row => row.id === statisticsConstants.AUDIO_MESSAGES_AMOUNT).value,
    stickersAmount: rows.find(row => row.id === statisticsConstants.STICKERS_AMOUNT).value,
    repostsAmount: rows.find(row => row.id === statisticsConstants.REPOSTS_AMOUNT).value,
    mostActiveUsers,
    previousMonthAmount: previousMonthAmount >= 0 ? previousMonthAmount : null,
  };
};

module.exports.resetStatistics = async function() {
  const result = await db.query('SELECT * FROM friends_vk_bot.statistics');
  const rows = result.rows.map(row => {
    return {
      id: parseInt(row.id, 10),
      value: row.value
    };
  });

  const totalCounter = rows.find(row => row.id === statisticsConstants.TOTAL_AMOUNT).value;

  let resetQuery = 'BEGIN TRANSACTION;\n';
  resetQuery += `UPDATE friends_vk_bot.statistics SET value = ${totalCounter} WHERE id = ${statisticsConstants.PREVIOUS_MONTH_AMOUNT};\n`;
  resetQuery += `UPDATE friends_vk_bot.statistics SET value = 0 WHERE id <> ${statisticsConstants.PREVIOUS_MONTH_AMOUNT};\n`;
  resetQuery += 'END TRANSACTION';
  db.query(resetQuery).catch(error => console.error(error));
};
