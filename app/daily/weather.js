const axios = require('axios');
require('dotenv').config();

const handleError = function (error) {
  if (error.response) {
    return JSON.stringify(error.response.data);
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
    const response = await axios.get('http://api.openweathermap.org/data/2.5/weather', { params });
    return response.data;
  } catch (error) {
    console.log('Error: ' + handleError(error));
  }
};

module.exports.getForecast = async function() {
  try {
    const response = await axios.get('http://api.openweathermap.org/data/2.5/forecast', { params: { ...params, cnt: 6 }});
    return response.data.list;
  } catch (error) {
    console.log('Error: ' + handleError(error));
  }
};
