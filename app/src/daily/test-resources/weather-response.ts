import {Weather} from '../weather/model/Weather';
import {WeatherForecast} from '../weather/model/WeatherForecast';

export const weatherResponseLowWindSpeed: Weather = {
  weather: [{ description: 'солнечно' }],
  main: {
    temp: 10,
  },
  wind: {
    speed: 1,
  },
  dt: 1651921680,
};

export const weatherResponseHighWindSpeed: Weather = {
  weather: [{ description: 'солнечно' }],
  main: {
    temp: 10,
  },
  wind: {
    speed: 10,
  },
  dt: 1651921680,
};

export const weatherForecastResponseLowWindSpeedLowGustSpeed: WeatherForecast = [{
  weather: [{ description: 'солнечно' }],
  main: {
    temp: 10,
  },
  wind: {
    speed: 1,
    gust: 2,
  },
  dt: 1651921680,
}];

export const weatherForecastResponseLowWindSpeedHighGustSpeed: WeatherForecast = [{
  weather: [{ description: 'солнечно' }],
  main: {
    temp: 10,
  },
  wind: {
    speed: 1,
    gust: 10,
  },
  dt: 1651921680,
}];

export const weatherForecastResponseHighWindSpeedHighGustSpeed: WeatherForecast = [{
  weather: [{ description: 'солнечно' }],
  main: {
    temp: 10,
  },
  wind: {
    speed: 10,
    gust: 15,
  },
  dt: 1651921680,
}];
