import {Outputter} from '../../model/Outputter';
import {Statistics} from '../model/Statistics';
import vk from '../../vk/vk';
import {
  getConcatenatedItems, getMonthNameInInstrumentalCase,
  getMonthNameInNominativeCase,
  getMonthNameInPrepositionalCase,
  getPluralForm
} from '../../util';
import {VkUser} from '../../vk/model/VkUser';

export const finalStatisticsOutputter: Outputter<Statistics> = {
  output: async data => {
    const statisticsMessage = await getStatisticsMessage(data);
    console.log(`Statistics: ${statisticsMessage}`);
    console.log(`Statistics message sent response: ${await vk.sendMessage({
      text: statisticsMessage,
    })}`);
    const leaderboardPhotos = data.leaderboardPhotos;

    const albumId = process.env.VK_LEADERBOARD_ALBUM_ID;
    for (const photoBuffer of leaderboardPhotos) {
      await vk.sendMessage({
        photos: [photoBuffer],
      });
      if (albumId) {
        await vk.addPhotoToAlbum(photoBuffer, albumId);
      }
    }
  }
};

async function getStatisticsMessage(statisticsObject: Statistics): Promise<string> {
  const previousMonthIndex = new Date().getMonth() - 1;

  const totalAmountMessage = getTotalAmountMessage(statisticsObject.totalAmount);
  const audioMessagesAmountMessage = getAudioMessagesAmountMessage(statisticsObject.audioMessagesAmount);
  const stickersAmountMessage = getStickersAmountMessage(statisticsObject.stickersAmount);
  const memesAmountMessage = getMemesAmountMessage(statisticsObject.memesAmount);

  const mostActiveUserNamesMessage =
    statisticsObject.mostActiveUsers.length > 0 ?
      getMostActiveUserNamesMessage(statisticsObject.mostActiveUsers, previousMonthIndex) :
      null;

  const comparisonMessage = statisticsObject.previousMonthAmount !== null ? getComparisonMessage(statisticsObject.previousMonthAmount, statisticsObject.totalAmount) : null;

  let resultMessage = `⚠ Статистика беседы за ${getMonthNameInNominativeCase(previousMonthIndex)}\n\n` +
    `В ${getMonthNameInPrepositionalCase(previousMonthIndex)} было отправлено ${totalAmountMessage}, из них:\n` +
    `— ${audioMessagesAmountMessage}\n`+
    `— ${stickersAmountMessage}\n`+
    `— ${memesAmountMessage}\n\n`;
  if (comparisonMessage) {
    resultMessage += `По сравнению с ${getMonthNameInInstrumentalCase(previousMonthIndex - 1)}, ` +
      `общее количество сообщений ${comparisonMessage}.\n\n`;
  }
  if (mostActiveUserNamesMessage) {
    resultMessage += mostActiveUserNamesMessage;
  }
  return resultMessage;
}

function getTotalAmountMessage(totalAmount: number): string {
  return `${totalAmount} ${getPluralForm(totalAmount, 'сообщение', 'сообщения', 'сообщений')}`;
}

function getAudioMessagesAmountMessage(audioMessagesAmount: number): string {
  return `${audioMessagesAmount} ${getPluralForm(audioMessagesAmount, 'голосовое сообщение', 'голосовых сообщения', 'голосовых сообщений')}`;
}

function getStickersAmountMessage(stickersAmount: number): string {
  return `${stickersAmount} ${getPluralForm(stickersAmount, 'стикер', 'стикера', 'стикеров')}`;
}

function getMemesAmountMessage(memesAmount: number): string {
  return memesAmount === 0 ? '0 мемов' : `не менее ${memesAmount} ${getPluralForm(memesAmount, 'мема', 'мемов', 'мемов')}`;
}

function getMostActiveUserNamesMessage(mostActiveUsers: VkUser[], previousMonthIndex: number): string {
  const mostActiveUsersNames = getMostActiveUsersNames(mostActiveUsers);
  const concatenatedMostActiveUsersNames = getConcatenatedItems(mostActiveUsersNames);

  return `${mostActiveUsers.length > 1 ? 'Самые активные участники' : 'Самый активный участник'} беседы ` +
    `в ${getMonthNameInPrepositionalCase(previousMonthIndex)} — ${concatenatedMostActiveUsersNames}.`;
}

function getMostActiveUsersNames(mostActiveUsers: VkUser[]): string[] {
  return mostActiveUsers.map(user => user.first_name);
}

function getComparisonMessage(monthBeforePreviousAmount: number, previousMonthAmount: number): string {
  if (previousMonthAmount === monthBeforePreviousAmount) {
    return 'не изменилось';
  }

  if (monthBeforePreviousAmount === 0) {
    return 'увеличилось на ∞%';
  }

  const percentageDelta = Math.round((previousMonthAmount - monthBeforePreviousAmount) / monthBeforePreviousAmount * 100);

  if (percentageDelta > 0) {
    return `увеличилось на ${percentageDelta}%`;
  }
  if (percentageDelta < 0) {
    return `уменьшилось на ${-percentageDelta}%`;
  }

  if (previousMonthAmount > monthBeforePreviousAmount) {
    return 'незначительно увеличилось';
  } else {
    return 'незначительно уменьшилось';
  }
}
