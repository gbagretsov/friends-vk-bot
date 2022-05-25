import db from '../db';
import vk from '../vk/vk';
import {createCanvas, Image, loadImage, registerFont} from 'canvas';
import needle from 'needle';
import {getMonthNameInNominativeCase, Month} from '../util';
import { StatisticsId } from './model/StatisticsId.enum';
import {VkMessage} from '../vk/model/VkMessage';
import {StatisticsDbRow} from './model/StatisticsDbRow';
import {Statistics} from './model/Statistics';
import {VkUser} from '../vk/model/VkUser';

async function handleMessage(message: VkMessage): Promise<false> {
  const result = await db.query<StatisticsDbRow>('SELECT * FROM friends_vk_bot.statistics');
  const rows: StatisticsDbRow[] = result.rows;
  let updateQuery = 'BEGIN TRANSACTION;\n';

  const totalCounter = rows.find(row => row.id === StatisticsId.TOTAL_AMOUNT)!.value + 1;
  updateQuery += `UPDATE friends_vk_bot.statistics SET value = ${totalCounter} WHERE id = ${StatisticsId.TOTAL_AMOUNT};\n`;

  const senderRow = rows.find(row => row.id === message.from_id);
  const senderCounter = senderRow ? senderRow.value + 1 : 1;
  if (senderRow) {
    updateQuery += `UPDATE friends_vk_bot.statistics SET value = ${senderCounter} WHERE id = ${message.from_id};\n`;
  } else {
    updateQuery += `INSERT INTO friends_vk_bot.statistics VALUES(${message.from_id}, ${senderCounter});\n`;
  }

  if (vk.isStickerMessage(message)) {
    const stickersCounter = rows.find(row => row.id === StatisticsId.STICKERS_AMOUNT)!.value + 1;
    updateQuery += `UPDATE friends_vk_bot.statistics SET value = ${stickersCounter} WHERE id = ${StatisticsId.STICKERS_AMOUNT};\n`;
  }

  if (vk.isAudioMessage(message)) {
    const audioMessagesCounter = rows.find(row => row.id === StatisticsId.AUDIO_MESSAGES_AMOUNT)!.value + 1;
    updateQuery += `UPDATE friends_vk_bot.statistics SET value = ${audioMessagesCounter} WHERE id = ${StatisticsId.AUDIO_MESSAGES_AMOUNT};\n`;
  }

  if (vk.isRepost(message)) {
    const repostsCounter = rows.find(row => row.id === StatisticsId.REPOSTS_AMOUNT)!.value + 1;
    updateQuery += `UPDATE friends_vk_bot.statistics SET value = ${repostsCounter} WHERE id = ${StatisticsId.REPOSTS_AMOUNT};\n`;
  }

  updateQuery += 'END TRANSACTION';
  try {
    await db.query(updateQuery);
  } catch (error) {
    console.error(error);
  }

  return false;
}

async function getStatistics(): Promise<Statistics | null> {
  const result = await db.query<StatisticsDbRow>('SELECT * FROM friends_vk_bot.statistics');
  const rows = result.rows;

  const previousMonthAmount = rows.find(row => row.id === StatisticsId.PREVIOUS_MONTH_AMOUNT)!.value;

  const userRows = rows.filter(row => row.id > 0 && row.value > 0);
  const maxMessagesAmount = userRows.reduce((currentMax, currentRow) => currentRow.value > currentMax ? currentRow.value : currentMax, -1);
  const mostActiveUsers = await Promise.all(
    userRows
      .filter(user => user.value === maxMessagesAmount)
      .map(async user => (await vk.getUserInfo(user.id)))
  );

  if (mostActiveUsers.some(user => !user)) {
    console.log('Cannot get info about all most active users');
    return null;
  }

  return {
    totalAmount: rows.find(row => row.id === StatisticsId.TOTAL_AMOUNT)!.value,
    audioMessagesAmount: rows.find(row => row.id === StatisticsId.AUDIO_MESSAGES_AMOUNT)!.value,
    stickersAmount: rows.find(row => row.id === StatisticsId.STICKERS_AMOUNT)!.value,
    repostsAmount: rows.find(row => row.id === StatisticsId.REPOSTS_AMOUNT)!.value,
    mostActiveUsers: mostActiveUsers as VkUser[],
    previousMonthAmount: previousMonthAmount >= 0 ? previousMonthAmount : null,
    leaderboardPhotos: await getLeaderboardPhotos(mostActiveUsers as VkUser[]),
  };
}

async function resetStatistics(): Promise<void> {
  const result = await db.query<StatisticsDbRow>('SELECT * FROM friends_vk_bot.statistics');
  const rows = result.rows;

  const totalCounter = rows.find(row => row.id === StatisticsId.TOTAL_AMOUNT)!.value;

  let resetQuery = 'BEGIN TRANSACTION;\n';
  resetQuery += `UPDATE friends_vk_bot.statistics SET value = ${totalCounter} WHERE id = ${StatisticsId.PREVIOUS_MONTH_AMOUNT};\n`;
  resetQuery += `UPDATE friends_vk_bot.statistics SET value = 0 WHERE id <> ${StatisticsId.PREVIOUS_MONTH_AMOUNT};\n`;
  resetQuery += 'END TRANSACTION';
  try {
    await db.query(resetQuery);
  } catch (error) {
    console.error(error);
  }
}

async function getLeaderboardPhotos(users: VkUser[]): Promise<Buffer[]> {
  const result = [];

  const date = new Date();
  const month = getMonthNameInNominativeCase(date.getMonth() - 1);
  const year = date.getMonth() === Month.JANUARY ? date.getFullYear() - 1 : date.getFullYear();
  const dateLine = `${month} ${year}`;

  const templateImage = await loadImage('assets/leaderboardPhotoTemplate.jpg');
  registerFont('assets/book-antiqua.ttf', { family: 'Book Antiqua', weight: 'normal' });
  registerFont('assets/book-antiqua-bold.ttf', { family: 'Book Antiqua', weight: 'bold' });

  for (const user of users) {
    if (!user.photo_max_orig) {
      console.log(`No photo for user ${user.id}`);
      continue;
    }
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
}

function getUserImageDrawArea(userImage: Image) {
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

export default handleMessage;

export {
  getStatistics,
  resetStatistics,
};
