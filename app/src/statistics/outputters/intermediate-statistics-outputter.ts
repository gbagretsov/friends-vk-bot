import {Outputter} from '../../model/Outputter';
import {Statistics} from '../model/Statistics';
import vk from '../../vk/vk';
import {
  getConcatenatedItems, getMonthNameInNominativeCase,
  getMonthNameInPrepositionalCase,
  getPluralForm
} from '../../util';
import {VkUser} from '../../vk/model/VkUser';

export const intermediateStatisticsOutputter: Outputter<Statistics> = {
  output: async data => {
    const statisticsMessage = await getStatisticsMessage(data);
    console.log(`Statistics: ${statisticsMessage}`);
    console.log(`Statistics message sent response: ${await vk.sendMessage({
      text: statisticsMessage,
    })}`);
  }
};

async function getStatisticsMessage(statisticsObject: Statistics): Promise<string> {
  const currentMonthIndex = new Date().getMonth();

  const totalAmountMessage = getTotalAmountMessage(statisticsObject.totalAmount);

  const mostActiveUserNamesMessage =
    statisticsObject.mostActiveUsers.length > 0 ?
      getMostActiveUserNamesMessage(statisticsObject.mostActiveUsers) :
      null;

  let resultMessage = `⚠ Промежуточная статистика беседы за ${getMonthNameInNominativeCase(currentMonthIndex)}\n\n` +
    `В ${getMonthNameInPrepositionalCase(currentMonthIndex)} было отправлено ${totalAmountMessage}.\n\n`;

  if (mostActiveUserNamesMessage) {
    resultMessage += mostActiveUserNamesMessage;
  }
  return resultMessage;
}

function getTotalAmountMessage(totalAmount: number): string {
  return `${totalAmount} ${getPluralForm(totalAmount, 'сообщение', 'сообщения', 'сообщений')}`;
}

function getMostActiveUserNamesMessage(mostActiveUsers: VkUser[]): string {
  const mostActiveUsersNames = getMostActiveUsersNames(mostActiveUsers);
  const concatenatedMostActiveUsersNames = getConcatenatedItems(mostActiveUsersNames);

  return `${mostActiveUsers.length > 1 ? 'Самые активные участники' : 'Самый активный участник'} беседы ` +
    `на текущий момент — ${concatenatedMostActiveUsersNames}.`;
}

function getMostActiveUsersNames(mostActiveUsers: VkUser[]): string[] {
  return mostActiveUsers.map(user => user.first_name);
}

