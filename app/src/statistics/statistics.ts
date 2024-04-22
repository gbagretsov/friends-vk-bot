import db from '../db';
import vk from '../vk/vk';
import needle from 'needle';
import {getLeaderBoardPhoto, getMonthNameInNominativeCase, Month} from '../util';
import { StatisticsId } from './model/StatisticsId.enum';
import {VkMessage} from '../vk/model/VkMessage';
import {StatisticsDbRow} from './model/StatisticsDbRow';
import {Statistics} from './model/Statistics';
import {VkUser} from '../vk/model/VkUser';

async function handleMessage(message: VkMessage): Promise<false> {
  let updateQuery = 'BEGIN TRANSACTION;\n';

  updateQuery += `UPDATE friends_vk_bot.statistics SET value = value + 1 WHERE id = ${StatisticsId.TOTAL_AMOUNT};\n`;

  updateQuery += `INSERT INTO friends_vk_bot.statistics VALUES(${message.from_id}, 1)
                  ON CONFLICT (id) DO UPDATE SET value = friends_vk_bot.statistics.value + 1;\n`;

  if (vk.isStickerMessage(message)) {
    updateQuery += `UPDATE friends_vk_bot.statistics SET value = value + 1 WHERE id = ${StatisticsId.STICKERS_AMOUNT};\n`;
  }

  if (vk.isAudioMessage(message)) {
    updateQuery += `UPDATE friends_vk_bot.statistics SET value = value + 1 WHERE id = ${StatisticsId.AUDIO_MESSAGES_AMOUNT};\n`;
  }

  if (vk.isRepost(message)) {
    updateQuery += `UPDATE friends_vk_bot.statistics SET value = value + 1 WHERE id = ${StatisticsId.REPOSTS_AMOUNT};\n`;
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
    leaderboardPhotos: await getUserLeaderboardPhotos(mostActiveUsers as VkUser[]),
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

async function getUserLeaderboardPhotos(users: VkUser[]): Promise<Buffer[]> {
  const result = [];

  const date = new Date();
  const month = getMonthNameInNominativeCase(date.getMonth() - 1);
  const year = date.getMonth() === Month.JANUARY ? date.getFullYear() - 1 : date.getFullYear();
  const dateLine = `${month} ${year}`;

  for (const user of users) {
    if (!user.photo_max_orig) {
      console.log(`No photo for user ${user.id}`);
      continue;
    }

    const redirectOptions = { follow_max: 2 };
    const userPhotoBuffer = (await needle('get', user.photo_max_orig, null, redirectOptions)).body;
    const nameLine = `${user.first_name} ${user.last_name}`;
    const userLeaderBoardPhoto = await getLeaderBoardPhoto(userPhotoBuffer, 'Лучший собеседник месяца', nameLine, dateLine);
    result.push(userLeaderBoardPhoto);
  }

  return result;
}

export default handleMessage;

export {
  getStatistics,
  resetStatistics,
};
