const sender = require('../vk');
const weather = require('./weather');
const holidays = require('./holidays');
const util = require('util')
const db = require('../db');

function getWeatherMessage(weather, forecast) {
  return `Доброе утро!
Сейчас на улице ${ weather.weather[0].description }, температура ${ Math.round(weather.main.temp)}°C, ветер ${ weather.wind.speed.toFixed(1)} м/с
Прогноз погоды на сегодня:
- днём ${ forecast[1].weather[0].description }, температура ${ Math.round(forecast[1].main.temp) }°C, ветер ${ forecast[1].wind.speed.toFixed(1) } м/с
- вечером ${ forecast[3].weather[0].description }, температура ${ Math.round(forecast[3].main.temp)}°C, ветер ${ forecast[3].wind.speed.toFixed(1) } м/с`;
}

function getHolidaysMessage(holidays) {
  if (holidays.length) {
    let concatenatedHolidays = holidays.reduce((sum, cur, i, arr) => {
      if (i === arr.length - 1) {
        return `${sum} и ${cur}`;
      } else {
        return `${sum}, ${cur}`;
      };
    });

    let phrases = [
      `🎉 A вы знали, что сегодня ${concatenatedHolidays}? Подробнее здесь: calend.ru`,
      `🎉 Сегодня отмечается ${concatenatedHolidays}! Подробности на сайте calend.ru`,
      `🎉 Готов поспорить, вы не могли дождаться, когда наступит ${concatenatedHolidays}. Этот день настал! Подробнее здесь: calend.ru`,
      `🎉 Напишите мне в ответ, как вы будете отмечать ${concatenatedHolidays}. Если не знаете, что это, загляните сюда: calend.ru`,
    ];

    return phrases[Math.floor(Math.random() * phrases.length)];
  } else {
    return '';
  }
}

function getAdsMessage() {
  const client = db();
  return client.query("SELECT value FROM friends_vk_bot.state WHERE key = 'ads';")
    .then(r => r.rows[0].value);
}

(async() => {

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
  console.log(`Holidays message sent response: ${ await sender.sendMessage(holidaysMessage) }`);
  
  let ads = await getAdsMessage();
  console.log(`Ads: ${ ads }`);
  if (ads) {
    console.log(`Ads message sent response: ${ await sender.sendMessage(ads) }`);
  }
  
})();