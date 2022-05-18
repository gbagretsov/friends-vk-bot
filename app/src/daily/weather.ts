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
    if (!response.body.weather) {
      console.log(`getCurrentWeather error: ${JSON.stringify(response.body)}`);
      return null;
    }
    return response.body as Weather;
  } catch (error) {
    console.log(`getCurrentWeather error: ${JSON.stringify(error)}`);
    return null;
  }
}

async function getForecast(): Promise<WeatherForecast | null> {
  try {
    const response = await retry(async () => {
      return await needle('get', `${OPENWEATHERMAP_API_URL}/forecast`, { ...OPENWEATHERMAP_PARAMS, cnt: 6 }, {});
    }, retryParams);
    if (!response.body.list) {
      console.log(`getForecast error: ${JSON.stringify(response.body)}`);
      return null;
    }
    return response.body.list as WeatherForecast;
  } catch (error) {
    console.log(`getForecast error: ${JSON.stringify(error)}`);
    return null;
  }
}

async function getUvIndex(): Promise<number | null> {
  try {
    const response = await retry(async () => {
      return await needle('get', `${WEATHERBIT_IO_API_URL}/forecast/daily`, WEATHERBIT_IO_PARAMS, {});
    }, retryParams);
    if (response.body.error) {
      console.log(`getUvIndex error: ${response.body.error}`);
      return null;
    }
    return response.body.data[0].uv;
  } catch (error) {
    console.log(`getUvIndex Error: ${JSON.stringify(error)}`);
    return null;
  }
}

export default {
  getCurrentWeather,
  getForecast,
  getUvIndex,
};
