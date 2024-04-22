import {Outputter} from '../../model/Outputter';
import vk from '../../vk/vk';
import {MemesStatistics} from '../model/MemesStatistics';
import {getLeaderBoardPhoto, getMonthNameInNominativeCase, Month} from '../../util';
import {VkUser} from '../../vk/model/VkUser';

export const memesStatisticsOutputter: Outputter<MemesStatistics> = {
  output: async data => {
    if (data.topMemes.length === 0) {
      return;
    }

    const date = new Date();
    const monthNomCase = getMonthNameInNominativeCase(date.getMonth() - 1);
    const year = date.getMonth() === Month.JANUARY ? date.getFullYear() - 1 : date.getFullYear();

    let topMemesText = `⭐ Топ мемов за ${monthNomCase} ${year}\n\n`;
    const memeLeaderBoardPhotos: Buffer[] = [];

    for (let i = 0; i < data.topMemes.length; i++) {
      const meme = data.topMemes[i];
      const author = await vk.getUserInfo(meme.author_id) as VkUser;
      const dateLine = `${monthNomCase} ${year}`;
      const authorInfo = `${author.first_name} ${author.last_name}`;
      // Посмотрим, будет ли понятно через пару лет, почему у меня бомбило с этого бага и зачем здесь нужен replace
      const ratingInfo = `${meme.rating.toFixed(2).replace('.', '.\u{2060}')}`;

      topMemesText += `${i + 1} место — ${authorInfo}, средний балл ${ratingInfo}\n`;

      const memeLeaderBoardPhoto = await getLeaderBoardPhoto(meme.image, `Лучший мем месяца #${i + 1}`, authorInfo, dateLine);
      memeLeaderBoardPhotos.push(memeLeaderBoardPhoto);
    }

    await vk.sendMessageWithPhotos(memeLeaderBoardPhotos, topMemesText);
  }
};
