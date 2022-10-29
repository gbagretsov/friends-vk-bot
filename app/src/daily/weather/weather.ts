import needle from 'needle';
import retry, {Options} from 'async-retry';
import {config} from 'dotenv';
import {Weather} from './model/Weather';
import {WeatherForecast} from './model/WeatherForecast';

config();

// TODO: return to https when it is available
const OPENWEATHERMAP_API_URL = 'http://api.openweathermap.org/data/2.5';
const ACCUWEATHER_API_URL = 'https://dataservice.accuweather.com/';

const OPENWEATHERMAP_PARAMS = {
  lat: process.env.LATITUDE,
  lon: process.env.LONGITUDE,
  APPID: process.env.OPENWEATHERMAP_APPID,
  units: 'metric',
  lang: 'ru',
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
    const locationKeyResponse = await retry(async () => {
      return await needle('get', `${ACCUWEATHER_API_URL}/locations/v1/cities/geoposition/search`, {
        apikey: process.env.ACCUWEATHER_API_KEY,
        q: `${process.env.LATITUDE},${process.env.LONGITUDE}`,
      }, {});
    }, retryParams);
    if (locationKeyResponse.statusCode !== 200) {
      console.log(`getUvIndex: geo position search error: ${JSON.stringify(locationKeyResponse.body)}`);
      return null;
    }
    const locationKey = locationKeyResponse.body.Key as string;

    const forecastResponse = await retry(async () => {
      return await needle('get', `${ACCUWEATHER_API_URL}/forecasts/v1/daily/1day/${locationKey}`, {
        apikey: process.env.ACCUWEATHER_API_KEY,
        details: true,
      }, {});
    }, retryParams);
    if (forecastResponse.statusCode !== 200) {
      console.log(`getUvIndex: forecasts error: ${JSON.stringify(locationKeyResponse.body)}`);
      return null;
    }
    const airAndPollenList = forecastResponse.body.DailyForecasts[0].AirAndPollen as {
      Name: string,
      Value: number,
    }[];
    return airAndPollenList.find(airAndPollenListItem => airAndPollenListItem.Name === 'UVIndex')!.Value;
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
