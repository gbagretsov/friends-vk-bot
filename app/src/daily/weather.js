const needle = require('needle');
const retry = require('async-retry');
require('dotenv').config();

const params = {
  id: 532288,
  APPID: process.env.OPENWEATHER_APPID,
  units: 'metric',
  lang: 'ru',
};

const retryParams = {
  retries: 5
};

module.exports.getCurrentWeather = async function() {
  try {
    const response = await retry(async () => {
      return await needle('get', 'http://api.openweathermap.org/data/2.5/weather', { ...params }, null);
    }, retryParams);
    return response.body;
  } catch (error) {
    console.log('Error: ' + JSON.stringify(error));
  }
};

module.exports.getForecast = async function() {
  try {
    const response = await retry(async () => {
      return await needle('get', 'http://api.openweathermap.org/data/2.5/forecast', { ...params, cnt: 6 }, null);
    }, retryParams);
    return response.body.list;
  } catch (error) {
    console.log('Error: ' + JSON.stringify(error));
  }
};
