import needle from 'needle';
import retry, {Options} from 'async-retry';
import {config} from 'dotenv';
import {Weather} from './model/Weather';
import {WeatherForecast} from './model/WeatherForecast';

config();

const OPENWEATHERMAP_API_URL = 'https://api.openweathermap.org/data/2.5';
const WEATHERBIT_IO_API_URL = 'https://api.weatherbit.io/v2.0';

const LAT_LON_PARAMS = {
  lat: 53.4,
  lon: 58.98,
};

const OPENWEATHERMAP_PARAMS = {
  ...LAT_LON_PARAMS,
  APPID: process.env.OPENWEATHERMAP_APPID,
  units: 'metric',
  lang: 'ru',
};

const WEATHERBIT_IO_PARAMS = {
  ...LAT_LON_PARAMS,
  key: process.env.WEATHERBIT_IO_API_KEY,
  days: 1,
};

const retryParams: Options = {
  retries: 5,
};

async function getCurrentWeather(): Promise<Weather | null> {
  try {
    const response = await retry(async () => {
      return await needle('get', `${OPENWEATHERMAP_API_URL}/weather`, { ...OPENWEATHERMAP_PARAMS }, {});
    }, retryParams);
    return response.body as Weather;
  } catch (error) {
    console.log('Error: ' + JSON.stringify(error));
    return null;
  }
}

async function getForecast(): Promise<WeatherForecast | null> {
  try {
    const response = await retry(async () => {
      return await needle('get', `${OPENWEATHERMAP_API_URL}/forecast`, { ...OPENWEATHERMAP_PARAMS, cnt: 6 }, {});
    }, retryParams);
    return response.body.list as WeatherForecast;
  } catch (error) {
    console.log('Error: ' + JSON.stringify(error));
    return null;
  }
}

async function getUvIndex(): Promise<number | null> {
  try {
    const response = await retry(async () => {
      return await needle('get', `${WEATHERBIT_IO_API_URL}/forecast/daily`, WEATHERBIT_IO_PARAMS, {});
    }, retryParams);
    return response.body.data[0].uv;
  } catch (error) {
    console.log('Error: ' + JSON.stringify(error));
    return null;
  }
}

export default {
  getCurrentWeather,
  getForecast,
  getUvIndex,
};
