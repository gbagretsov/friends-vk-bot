import {Outputter} from '../../model/Outputter';
import vk from '../../vk/vk';
import {MemesStatistics} from '../model/MemesStatistics';
import {getLeaderBoardPhoto, getMonthNameInNominativeCase, Month} from '../../util';
import {VkUser} from '../../vk/model/VkUser';
import {getPhotoSize} from '../memes';
import needle from 'needle';

export const memesStatisticsOutputter: Outputter<MemesStatistics> = {
  output: async memesStats => {
    const {topMemes, memesPerAuthor} = memesStats;

    if (topMemes.length === 0) {
      return;
    }

    const date = new Date();
    const monthNomCase = getMonthNameInNominativeCase(date.getMonth() - 1);
    const year = date.getMonth() === Month.JANUARY ? date.getFullYear() - 1 : date.getFullYear();

    const topMemesText = `⭐ Топ мемов за ${monthNomCase} ${year}`;
    const memeLeaderBoardPhotos: Buffer[] = [];

    for (let i = 0; i < topMemes.length; i++) {
      const meme = topMemes[i];
      const author = await vk.getUserInfo(meme.authorId) as VkUser;
      const dateLine = `${monthNomCase} ${year}`;
      const authorInfo = `${author.first_name} ${author.last_name}`;
      const ratingInfo = `${meme.rating.toFixed(2)}`;

      const message = await vk.getMessageByConversationMessageId(meme.cmidId);
      if (!message) {
        continue;
      }

      const photoSize = getPhotoSize(message);
      if (!photoSize) {
        continue;
      }

      const imageLoadResponse = await needle('get', photoSize.url, null, { follow_max: 1 });
      const imageBuffer = imageLoadResponse.body;
      const memeLeaderBoardPhoto = await getLeaderBoardPhoto(imageBuffer, `Лучший мем месяца #${i + 1}`, authorInfo, dateLine);
      memeLeaderBoardPhotos.push(memeLeaderBoardPhoto);
    }

    await vk.sendMessage({
      photos: memeLeaderBoardPhotos,
      text: topMemesText,
      keyboard: {
        inline: true,
        buttons: [[{
          action: {
            type: 'text',
            label: 'Подробный отчёт',
          },
        }]]
      }
    });
  }
};
