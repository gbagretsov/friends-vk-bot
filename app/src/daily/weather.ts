import needle from 'needle';
import retry, {Options} from 'async-retry';
import {config} from 'dotenv';
import {Weather} from './model/Weather';
import {WeatherForecast} from './model/WeatherForecast';

config();

const WEATHER_API_URL = 'http://api.openweathermap.org/data/2.5';

const params = {
  id: 532288,
  APPID: process.env.OPENWEATHER_APPID,
  units: 'metric',
  lang: 'ru',
};

const retryParams: Options = {
  retries: 5,
};

export async function getCurrentWeather(): Promise<Weather | undefined> {
  try {
    const response = await retry(async () => {
      return await needle('get', `${WEATHER_API_URL}/weather`, { ...params }, {});
    }, retryParams);
    return response.body as Weather;
  } catch (error) {
    console.log('Error: ' + JSON.stringify(error));
  }
}

export async function getForecast(): Promise<WeatherForecast | undefined> {
  try {
    const response = await retry(async () => {
      return await needle('get', `${WEATHER_API_URL}/forecast`, { ...params, cnt: 6 }, {});
    }, retryParams);
    return response.body.list as WeatherForecast;
  } catch (error) {
    console.log('Error: ' + JSON.stringify(error));
  }
}
