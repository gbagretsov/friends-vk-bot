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

module.exports = function(app) {
  app.get('/daily', (req, res) => {

    let response = '';

    let currentWeather = weather.getCurrentWeather();
    let forecast = weather.getForecast();
    let weatherMessage;

    Promise.all([currentWeather, forecast])
      .then(values => {
        response += `Weather: ${ util.inspect(values[0]) }<br/>`;
        response += `Forecast: ${ util.inspect(values[1]) }<br/>`;
        weatherMessage = getWeatherMessage(values[0], values[1]);
        response += `Weather message: ${weatherMessage}<br/>`;
        
        let randomID = stickersIDs[Math.floor(Math.random() * stickersIDs.length)];
        return sender.sendSticker(randomID);
      })
      .then(result => {
        response += `Sticker sent response: ${util.inspect(result)}<br/>`;
        return sender.sendMessage(weatherMessage);
      })
      .then(result => {
        response += `Weather message sent response: ${util.inspect(result)}<br/>`;
        res.send(response);
      })
      .catch((error) => {
        response += `Error: ${error}`;
        res.send(response);
      });
    
  })
};
