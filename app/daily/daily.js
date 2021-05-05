const sender = require('../vk');
const weather = require('./weather');
const holidays = require('./holidays');
const statistics = require('../statistics/statistics');
const util = require('util');
const db = require('../db');
require('dotenv').config();
const {
  getConcatenatedItems,
  getPluralForm,
  getMonthNameInNominativeCase,
  getMonthNameInInstrumentalCase,
  getMonthNameInPrepositionalCase,
} = require('../util');

function getWeatherMessage(weather, forecast) {
  if (!weather || !forecast) {
    return `Доброе утро!
Я не смог узнать прогноз погоды 😞`;
  }
  return `Доброе утро!
Сейчас на улице ${ weather.weather[0].description }, температура ${ Math.round(weather.main.temp)}°C, ветер ${ weather.wind.speed.toFixed(1)} м/с
Прогноз погоды на сегодня:
- днём ${ forecast[1].weather[0].description }, температура ${ Math.round(forecast[1].main.temp) }°C, ветер ${ forecast[1].wind.speed.toFixed(1) } м/с
- вечером ${ forecast[3].weather[0].description }, температура ${ Math.round(forecast[3].main.temp)}°C, ветер ${ forecast[3].wind.speed.toFixed(1) } м/с`;
}

function getHolidaysMessage(holidays) {
  if (!holidays) {
    return 'Я не смог узнать, какие сегодня праздники 😞 Мой источник calend.ru был недоступен';
  } else if (holidays.length) {
    let concatenatedHolidays = getConcatenatedItems(holidays);

    let phrases = [
      `🎉 A вы знали, что сегодня ${concatenatedHolidays}? Подробнее здесь: calend.ru`,
      `🎉 Сегодня отмечается ${concatenatedHolidays}! Подробности на сайте calend.ru`,
      `🎉 Готов поспорить, вы не могли дождаться, когда наступит ${concatenatedHolidays}. Этот день настал! Подробнее здесь: calend.ru`,
      `🎉 Напишите мне в ответ, как вы будете отмечать ${concatenatedHolidays}. Если не знаете, что это, загляните сюда: calend.ru`,
    ];

    return phrases[Math.floor(Math.random() * phrases.length)];
  } else {
    return 'Сегодня праздников нет 😞';
  }
}

async function getAdsMessage() {
  const response = await db.query('SELECT value FROM friends_vk_bot.state WHERE key = \'ads\';');
  return response.rows[0].value;
}

async function getStatisticsMessage(statisticsObject) {
  const previousMonthIndex = new Date().getMonth() - 1;

  const totalAmountMessage = getTotalAmountMessage(statisticsObject.totalAmount);
  const audioMessagesAmountMessage = getAudioMessagesAmountMessage(statisticsObject.audioMessagesAmount);
  const stickersAmountMessage = getStickersAmountMessage(statisticsObject.stickersAmount);
  const repostsAmountMessage = getRepostsAmountMessage(statisticsObject.repostsAmount);

  const mostActiveUserNamesMessage = statisticsObject.mostActiveUsers.length > 0 ? await getMostActiveUserNamesMessage(statisticsObject.mostActiveUsers, previousMonthIndex) : null;

  const comparisonMessage = statisticsObject.previousMonthAmount !== null ? getComparisonMessage(statisticsObject.previousMonthAmount, statisticsObject.totalAmount) : null;

  let resultMessage = `⚠ Статистика беседы за ${getMonthNameInNominativeCase(previousMonthIndex)} ⚠

В ${getMonthNameInPrepositionalCase(previousMonthIndex)} было отправлено ${totalAmountMessage}, из них:
— ${audioMessagesAmountMessage}
— ${stickersAmountMessage}
— ${repostsAmountMessage}
`;
  if (comparisonMessage) {
    resultMessage += `
По сравнению с ${getMonthNameInInstrumentalCase(previousMonthIndex - 1)}, общее количество сообщений ${comparisonMessage}.
`;
  }
  if (mostActiveUserNamesMessage) {
    resultMessage += mostActiveUserNamesMessage;
  }
  return resultMessage;
}

function statisticsShouldBeShown() {
  return process.env.DEBUG_STATISTICS === '1' || new Date().getDate() === 1;
}

function statisticsShouldBeReset() {
  return process.env.DEBUG_STATISTICS !== '1' && new Date().getDate() === 1;
}

function getTotalAmountMessage(totalAmount) {
  return `${totalAmount} ${getPluralForm(totalAmount, 'сообщение', 'сообщения', 'сообщений')}`;
}

function getAudioMessagesAmountMessage(audioMessagesAmount) {
  return `${audioMessagesAmount} ${getPluralForm(audioMessagesAmount, 'голосовое сообщение', 'голосовых сообщения', 'голосовых сообщений')}`;
}

function getStickersAmountMessage(stickersAmount) {
  return `${stickersAmount} ${getPluralForm(stickersAmount, 'стикер', 'стикера', 'стикеров')}`;
}

function getRepostsAmountMessage(repostsAmount) {
  return `${repostsAmount} ${getPluralForm(repostsAmount, 'репост', 'репоста', 'репостов')}`;
}

async function getMostActiveUserNamesMessage(mostActiveUsers, previousMonthIndex) {
  const mostActiveUsersNames = getMostActiveUsersNames(mostActiveUsers);
  const concatenatedMostActiveUsersNames = getConcatenatedItems(mostActiveUsersNames);

  return `
${mostActiveUsers.length > 1 ? 'Самые активные участники' : 'Самый активный участник'} беседы в ${getMonthNameInPrepositionalCase(previousMonthIndex)} — ${concatenatedMostActiveUsersNames}.
`;
}

function getMostActiveUsersNames(mostActiveUsers) {
  return mostActiveUsers.map(user => user.first_name);
}

function getComparisonMessage(monthBeforePreviousAmount, previousMonthAmount) {
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

module.exports = async() => {

  const stickersIDs = [
    16, 21, 28, 29, 30, 50, 52, 2079, 2770, 2778, 2780, 3003, 4323, 4343, 4346, 4535, 
  ];
  
  let [ currentWeather, forecast, todayHolidays ] = await Promise.all([
    weather.getCurrentWeather(), 
    weather.getForecast(), 
    holidays.getHolidays(),
  ]);
  
  console.log(`Weather: ${ util.inspect(currentWeather) }`);
  console.log(`Forecast: ${ util.inspect(forecast) }`);
  let weatherMessage = getWeatherMessage(currentWeather, forecast);  
  
  let randomID = stickersIDs[Math.floor(Math.random() * stickersIDs.length)];
  console.log(`Sticker sent response: ${ await sender.sendSticker(randomID) }`);
  
  console.log(`Weather message: ${ weatherMessage }`);
  console.log(`Weather message sent response: ${ await sender.sendMessage(weatherMessage) }`);
  
  let holidaysMessage = getHolidaysMessage(todayHolidays);
  console.log(`Holidays: ${ util.inspect(todayHolidays) }`);
  if (holidaysMessage) {
    console.log(`Holidays message sent response: ${ await sender.sendMessage(holidaysMessage) }`);
  }

  let ads = await getAdsMessage();
  console.log(`Ads: ${ ads }`);
  if (ads) {
    console.log(`Ads message sent response: ${ await sender.sendMessage(ads) }`);
  }

  const albumId = process.env.VK_LEADERBOARD_ALBUM_ID;
  if (statisticsShouldBeShown()) {
    const statisticsObject = await statistics.getStatistics();
    const statisticsMessage = await getStatisticsMessage(statisticsObject);
    console.log(`Statistics: ${ statisticsMessage }`);
    console.log(`Statistics message sent response: ${ await sender.sendMessage(statisticsMessage) }`);
    const leaderboardPhotos = await statistics.getLeaderboardPhotos(statisticsObject);
    for (const photoBuffer of leaderboardPhotos) {
      await sender.sendPhotoToChat(photoBuffer);
      if (albumId) {
        await sender.addPhotoToAlbum(photoBuffer, albumId);
      }
    }
  }
  if (statisticsShouldBeReset()) {
    await statistics.resetStatistics();
  }

};
