import vk from '../vk/vk';
import weather from './weather';
import holidays from './holidays';
import {getStatistics, resetStatistics} from '../statistics/statistics';
import util from 'util';
import db from '../db';
import {
  getConcatenatedItems,
  getMonthNameInInstrumentalCase,
  getMonthNameInNominativeCase, getMonthNameInPrepositionalCase,
  getPluralForm
} from '../util';
import {config} from 'dotenv';
import {Weather} from './model/Weather';
import {WeatherForecast} from './model/WeatherForecast';
import {VkUser} from '../vk/model/VkUser';
import {Statistics} from '../statistics/model/Statistics';

config();

function getWeatherMessage(weather: Weather | null, forecast: WeatherForecast | null): string {
  if (!weather || !forecast) {
    return 'Доброе утро! \n Я не смог узнать прогноз погоды 😞';
  }
  const hoursOffset = parseInt(process.env.TIME_ZONE_HOURS_OFFSET);
  const concatenatedWeatherForecast = forecast.reduce((sum, cur) => {
    const date = new Date(cur.dt * 1000);
    return `${sum}
            - в ${(date.getUTCHours() + hoursOffset) % 24}:00 ${getWeatherLine(cur)}`;
  }, '');
  return `Доброе утро!
    Сейчас на улице ${getWeatherLine(weather)} \n
    Прогноз погоды на сегодня: ${concatenatedWeatherForecast}`;
}

function getWeatherLine(weatherObject: Weather): string {
  return `${ weatherObject.weather[0].description }, ${ Math.round(weatherObject.main.temp)}°C, ветер ${ Math.round(weatherObject.wind.speed)} м/с`;
}

async function getHolidaysMessage(holidays: string[] | null): Promise<string> {
  if (!holidays) {
    return 'Я не смог узнать, какие сегодня праздники 😞 Мой источник calend.ru был недоступен';
  } else if (holidays.length) {
    const concatenatedHolidays = getConcatenatedItems(holidays);

    const phrases = [
      `🎉 A вы знали, что сегодня ${concatenatedHolidays}? Подробнее здесь: calend.ru`,
      `🎉 Сегодня отмечается ${concatenatedHolidays}! Подробности на сайте calend.ru`,
      `🎉 Готов поспорить, вы не могли дождаться, когда наступит ${concatenatedHolidays}. Этот день настал! Подробнее здесь: calend.ru`,
      `🎉 Напишите мне в ответ, как вы будете отмечать ${concatenatedHolidays}. Если не знаете, что это, загляните сюда: calend.ru`,
    ];

    return phrases[Math.floor(Math.random() * phrases.length)];
  } else {
    const response = await db.query<{key: string, value: string}>
    ('SELECT value FROM friends_vk_bot.state WHERE key = \'absent_holidays_phrases\';');
    const absentHolidaysPhrases = response.rows[0].value.split('\n');
    return absentHolidaysPhrases[Math.floor(Math.random() * absentHolidaysPhrases.length)];
  }
}

async function getAdsMessage(): Promise<string> {
  const response = await db.query<{key: string, value: string}>
  ('SELECT value FROM friends_vk_bot.state WHERE key = \'ads\';');
  return response.rows[0].value;
}

async function getStatisticsMessage(statisticsObject: Statistics): Promise<string> {
  const previousMonthIndex = new Date().getMonth() - 1;

  const totalAmountMessage = getTotalAmountMessage(statisticsObject.totalAmount);
  const audioMessagesAmountMessage = getAudioMessagesAmountMessage(statisticsObject.audioMessagesAmount);
  const stickersAmountMessage = getStickersAmountMessage(statisticsObject.stickersAmount);
  const repostsAmountMessage = getRepostsAmountMessage(statisticsObject.repostsAmount);

  const mostActiveUserNamesMessage =
    statisticsObject.mostActiveUsers.length > 0 ?
      getMostActiveUserNamesMessage(statisticsObject.mostActiveUsers, previousMonthIndex) :
      null;

  const comparisonMessage = statisticsObject.previousMonthAmount !== null ? getComparisonMessage(statisticsObject.previousMonthAmount, statisticsObject.totalAmount) : null;

  let resultMessage = `⚠ Статистика беседы за ${getMonthNameInNominativeCase(previousMonthIndex)} ⚠

    В ${getMonthNameInPrepositionalCase(previousMonthIndex)} было отправлено ${totalAmountMessage}, из них:
    — ${audioMessagesAmountMessage}
    — ${stickersAmountMessage}
    — ${repostsAmountMessage}\n\n`;
  if (comparisonMessage) {
    resultMessage += `По сравнению с ${getMonthNameInInstrumentalCase(previousMonthIndex - 1)}, \
      общее количество сообщений ${comparisonMessage}.\n\n`;
  }
  if (mostActiveUserNamesMessage) {
    resultMessage += mostActiveUserNamesMessage;
  }
  return resultMessage;
}

function statisticsShouldBeShown(): boolean {
  return process.env.DEBUG_STATISTICS === '1' || new Date().getDate() === 1;
}

function statisticsShouldBeReset(): boolean {
  return process.env.DEBUG_STATISTICS !== '1' && new Date().getDate() === 1;
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

function getRepostsAmountMessage(repostsAmount: number): string {
  return `${repostsAmount} ${getPluralForm(repostsAmount, 'репост', 'репоста', 'репостов')}`;
}

function getMostActiveUserNamesMessage(mostActiveUsers: VkUser[], previousMonthIndex: number): string {
  const mostActiveUsersNames = getMostActiveUsersNames(mostActiveUsers);
  const concatenatedMostActiveUsersNames = getConcatenatedItems(mostActiveUsersNames);

  return `${mostActiveUsers.length > 1 ? 'Самые активные участники' : 'Самый активный участник'} беседы \
    в ${getMonthNameInPrepositionalCase(previousMonthIndex)} — ${concatenatedMostActiveUsersNames}.`;
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

export default async () => {

  const stickersIDs = [
    16, 21, 28, 29, 30, 50, 52, 2079, 2770, 2778, 2780, 3003, 4323, 4343, 4346, 4535,
  ];

  const [ currentWeather, forecast, todayHolidays ] = await Promise.all([
    weather.getCurrentWeather(),
    weather.getForecast(),
    holidays.getHolidays(),
  ]);

  console.log(`Weather: ${ util.inspect(currentWeather) }`);
  console.log(`Forecast: ${ util.inspect(forecast) }`);
  const weatherMessage = getWeatherMessage(currentWeather, forecast);

  const randomID = stickersIDs[Math.floor(Math.random() * stickersIDs.length)];
  console.log(`Sticker sent response: ${ await vk.sendSticker(randomID) }`);

  console.log(`Weather message: ${ weatherMessage }`);
  console.log(`Weather message sent response: ${ await vk.sendMessage(weatherMessage) }`);

  const holidaysMessage = await getHolidaysMessage(todayHolidays);
  console.log(`Holidays: ${ util.inspect(todayHolidays) }`);
  if (holidaysMessage) {
    console.log(`Holidays message sent response: ${ await vk.sendMessage(holidaysMessage) }`);
  }

  const ads = await getAdsMessage();
  console.log(`Ads: ${ ads }`);
  if (ads) {
    console.log(`Ads message sent response: ${ await vk.sendMessage(ads) }`);
  }

  const albumId = process.env.VK_LEADERBOARD_ALBUM_ID;
  if (statisticsShouldBeShown()) {
    const statisticsObject = await getStatistics();
    if (statisticsObject) {
      const statisticsMessage = await getStatisticsMessage(statisticsObject);
      console.log(`Statistics: ${statisticsMessage}`);
      console.log(`Statistics message sent response: ${await vk.sendMessage(statisticsMessage)}`);
      const leaderboardPhotos = statisticsObject.leaderboardPhotos;
      for (const photoBuffer of leaderboardPhotos) {
        await vk.sendPhotoToChat(photoBuffer);
        if (albumId) {
          await vk.addPhotoToAlbum(photoBuffer, albumId);
        }
      }
    }
  }
  if (statisticsShouldBeReset()) {
    await resetStatistics();
  }

};
