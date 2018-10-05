const axios = require('axios');
require('dotenv').config();

let errorHandler = function (error) {
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

module.exports.getCurrentWeather = function() {
  return axios.get('http://api.openweathermap.org/data/2.5/weather', {
      params: params
    })
    .then(function (response) {
      return response.data;
    })
    .catch(errorHandler);
}

module.exports.getForecast = function() {
  return axios.get('http://api.openweathermap.org/data/2.5/forecast', {
      params: params
    })
    .then(function (response) {
      return response.data.list;
    })
    .catch(errorHandler);
}
