const sender = require('./sender');
const weather = require('./weather');
const util = require('util')

function getWeatherMessage(weather, forecast) {
  return `Доброе утро!
  Сейчас на улице ${ weather.weather[0].description }, температура ${ Math.round(weather.main.temp)}°C, ветер ${ weather.wind.speed.toFixed(1)} м/с
  Прогноз погоды на сегодня:
  - днём ${ forecast[1].weather[0].description }, температура ${ Math.round(forecast[1].main.temp) }°C, ветер ${ forecast[1].wind.speed.toFixed(1) } м/с
  - вечером ${ forecast[3].weather[0].description }, температура ${ Math.round(forecast[3].main.temp)}°C, ветер ${ forecast[3].wind.speed.toFixed(1) } м/с`;
}

const stickersIDs = [
  16, 21, 28, 29, 30, 50, 52, 2079, 2770, 2778, 2780, 3003, 4323, 4343, 4346, 4535, 
];

let currentWeather = weather.getCurrentWeather();
let forecast = weather.getForecast();
let weatherMessage;

Promise.all([currentWeather, forecast])
  .then(values => {
    console.log(`Weather: ${ util.inspect(values[0]) }`);
    console.log(`Forecast: ${ util.inspect(values[1]) }`);
    weatherMessage = getWeatherMessage(values[0], values[1]);
    console.log(`Weather message: ${weatherMessage}`);
    
    let randomID = stickersIDs[Math.floor(Math.random() * stickersIDs.length)];
    return sender.sendSticker(randomID);
  })
  .then(result => {
    console.log(`Sticker sent response: ${util.inspect(result)}`);
    return sender.sendMessage(weatherMessage);
  })
  .then(result => {
    console.log(`Weather message sent response: ${util.inspect(result)}`);
  })
  .catch((error) => {
    console.log(`Error: ${error}`);
  });
