import {Weather} from '../model/Weather';
import {WeatherForecast} from '../model/WeatherForecast';

export const weatherResponse: Weather = {
  weather: [{ description: 'солнечно' }],
  main: {
    temp: 10,
  },
  wind: {
    speed: 1,
  },
  dt: 1651921680,
};

export const weatherForecastResponse: WeatherForecast = [
  weatherResponse,
  weatherResponse,
  weatherResponse,
  weatherResponse,
  weatherResponse,
  weatherResponse,
];
