const axios = require('axios');

let errorHandler = function (error) {
  if (error.response) {
    return error.response.data;
  } else if (error.request) {
    return error.message;
  }
};

const params = {
  id: 532288,
  APPID: '334b5949333f7866283a11f1312092c2',
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
