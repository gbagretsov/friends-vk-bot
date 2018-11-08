const axios = require('axios');
require('dotenv').config();

let handleError = function (error) {
  if (error.response) {
    return error.response.data;
  } else if (error.request) {
    return error.message;
  }
};

const params = {
  id: 532288,
  APPID: process.env.OPENWEATHER_APPID,
  units: 'metric',
  lang: 'ru',
};

module.exports.getCurrentWeather = async function() {
  try {
    let response = await axios.get('http://api.openweathermap.org/data/2.5/weather', { params });
    return response.data;
  } catch (error) {
    console.log(handleError(error));
  }
}

module.exports.getForecast = async function() {
  try {
    let response = await axios.get('http://api.openweathermap.org/data/2.5/forecast', { params });
    return response.data.list;
  } catch (error) {
    console.log(handleError(error));
  }
}
