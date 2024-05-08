import {Outputter} from '../../model/Outputter';
import vk from '../../vk/vk';
import {MemesStatistics} from '../model/MemesStatistics';
import {getLeaderBoardPhoto, getMonthNameInNominativeCase, Month} from '../../util';
import {VkUser} from '../../vk/model/VkUser';
import {getPhotoAttachment, getPhotoSize} from '../memes';
import needle from 'needle';

const MEMES_STATS_APP_ID = 51865720;

export const memesStatisticsOutputter: Outputter<MemesStatistics> = {
  output: async memesStats => {
    const {topMemes, memesPerAuthor} = memesStats;
    const topMemesTransfer: string[] = [];

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

      const message = await vk.getMessageByConversationMessageId(meme.cmidId);
      if (!message) {
        continue;
      }

      const photo = getPhotoAttachment(message);
      const photoSize = getPhotoSize(message);
      if (!photo || !photoSize) {
        continue;
      }

      const imageLoadResponse = await needle('get', photoSize.url, null, { follow_max: 1 });
      const imageBuffer = imageLoadResponse.body;
      const memeLeaderBoardPhoto = await getLeaderBoardPhoto(imageBuffer, `Лучший мем месяца #${i + 1}`, authorInfo, dateLine);
      memeLeaderBoardPhotos.push(memeLeaderBoardPhoto);

      const shortUrl = await vk.getShortLink(photoSize.url);
      if (!shortUrl) {
        console.log('No short url for image provided');
        continue;
      }

      topMemesTransfer.push(
        shortUrl.key + ';' +
        meme.authorId + ';' +
        meme.rating.toFixed(2) + ';' +
        meme.evaluationsCount + ';' +
        memesPerAuthor[meme.authorId]
      );
    }

    const topMemesTransferJoined = topMemesTransfer.join(';');
    console.log(topMemesTransferJoined);
    console.log(`Hash length = ${topMemesTransferJoined.length}`);

    await vk.sendMessage({
      photos: memeLeaderBoardPhotos,
      text: topMemesText,
      keyboard: {
        inline: true,
        buttons: [[{
          action: {
            type: 'open_app',
            label: 'Подробный отчёт',
            app_id: MEMES_STATS_APP_ID,
            hash: topMemesTransferJoined
          },
        }]]
      }
    });
  }
};
