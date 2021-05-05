const statisticsConstants = require('./statistics-constants');
const db = require('../db');
const vk = require('../vk');
const { createCanvas, loadImage } = require('canvas');
const needle = require('needle');
const util = require('../util');

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

function getUserImageDrawArea(userImage) {
  const userImageAvailableDrawArea = {
    x: 98,
    y: 165,
    width: 440,
    height: 440,
  };

  const actualWidth = userImage.width;
  const actualHeight = userImage.height;

  let resultWidth = userImageAvailableDrawArea.width;
  let resultX = userImageAvailableDrawArea.x;
  let resultHeight = resultWidth / actualWidth * actualHeight;
  let resultY = (userImageAvailableDrawArea.height - resultHeight) / 2 + userImageAvailableDrawArea.y;

  if (resultHeight > userImageAvailableDrawArea.height) {
    resultHeight = userImageAvailableDrawArea.height;
    resultY = userImageAvailableDrawArea.y;
    resultWidth = resultHeight / actualHeight * actualWidth;
    resultX = (userImageAvailableDrawArea.width - resultWidth) / 2 + userImageAvailableDrawArea.x;
  }

  return {
    x: resultX,
    y: resultY,
    width: resultWidth,
    height: resultHeight,
  };
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
  const mostActiveUsers = await Promise.all(
    userRows
      .filter(user => user.value === maxMessagesAmount)
      .map(async user => (await vk.getUserInfo(user.id)))
  );

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

module.exports.getLeaderboardPhotos = async function (statisticsObject) {
  const result = [];

  const date = new Date();
  const month = util.getMonthNameInNominativeCase(date.getMonth() - 1);
  const year = date.getFullYear();
  const dateLine = `${month} ${year}`;

  const templateImage = await loadImage('./app/statistics/leaderboardPhotoTemplate.jpg');

  for (const user of statisticsObject.mostActiveUsers) {
    const canvas = createCanvas(templateImage.width, templateImage.height);
    const context = canvas.getContext('2d');
    context.quality = 'best';
    context.patternQuality = 'best';
    context.drawImage(templateImage, 0, 0, templateImage.width, templateImage.height);

    const redirectOptions = { follow_max: 2 };
    const userPhotoBuffer = (await needle('get', user.photo_max_orig, null, redirectOptions)).body;
    const userImage = await loadImage(userPhotoBuffer);
    const userImageDrawArea = getUserImageDrawArea(userImage);
    const padding = 20;
    context.fillStyle = '#b5a08b';
    context.fillRect(
      userImageDrawArea.x,
      userImageDrawArea.y,
      userImageDrawArea.width,
      userImageDrawArea.height
    );
    context.drawImage(
      userImage,
      userImageDrawArea.x + padding,
      userImageDrawArea.y + padding,
      userImageDrawArea.width - 2 * padding,
      userImageDrawArea.height - 2 * padding
    );

    const nameLine = `${user.first_name} ${user.last_name}`;
    context.font = 'bold 18pt \'Book Antiqua\'';
    context.textAlign = 'center';
    context.fillStyle = '#3c3429';
    context.fillText(nameLine, templateImage.width / 2, 658);

    context.font = '14pt \'Book Antiqua\'';
    context.fillText(dateLine, templateImage.width / 2, 682);

    result.push(canvas.toBuffer('image/jpeg'));
  }

  return result;
};
