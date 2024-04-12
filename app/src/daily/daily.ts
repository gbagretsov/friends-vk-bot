import vk from '../vk/vk';
import weather from './weather/weather';
import holidays from './holidays/holidays';
import {getStatistics, resetStatistics} from '../statistics/statistics';
import util from 'util';
import db from '../db';
import {Month} from '../util';
import {config} from 'dotenv';
import {Weather} from './weather/model/Weather';
import {WeatherForecast} from './weather/model/WeatherForecast';
import {finalStatisticsOutputter} from '../statistics/outputters/final-statistics-outputter';
import {intermediateStatisticsOutputter} from '../statistics/outputters/intermediate-statistics-outputter';
import {holidaysOutputter} from './holidays/holidays-outputter';

config();

const NO_WARNING_ICON = '✅';
const WARNING_ICON = '⚠';
const DANGER_ICON = '❗';

const MEDIUM_UV_INDEX = 3;
const HIGH_UV_INDEX = 6;

const HIGH_WIND_SPEED = 10;

function getWeatherMessage(weather: Weather | null, forecast: WeatherForecast | null, uvIndex: number | null): string {
  if (!weather || !forecast) {
    return 'Доброе утро! \n Я не смог узнать прогноз погоды 😞';
  }
  const hoursOffset = parseInt(process.env.TIME_ZONE_HOURS_OFFSET);
  const concatenatedWeatherForecast = forecast.reduce((sum, cur) => {
    const date = new Date(cur.dt * 1000);
    return `${sum}\n- в ${(date.getUTCHours() + hoursOffset) % 24}:00 ${getWeatherLine(cur)}`;
  }, '');
  let weatherMessage = 'Доброе утро!\n' +
    `Сейчас на улице ${getWeatherLine(weather)}\n\n` +
    `Прогноз погоды на сегодня: ${concatenatedWeatherForecast}`;
  if (uvIndex !== null && showUvIndex()) {
    weatherMessage += `\n\n${getUvIndexInfo(uvIndex)}`;
  }
  return weatherMessage;
}

function showUvIndex(): boolean {
  const today = new Date();
  return today.getMonth() >= Month.MAY && today.getMonth() <= Month.SEPTEMBER;
}

function getUvIndexInfo(uvIndex: number): string {
  let dangerLevel: string;
  let recommendations: string;
  let dangerLevelIcon: string;
  if (uvIndex >= HIGH_UV_INDEX) {
    dangerLevel = 'высокий';
    dangerLevelIcon = DANGER_ICON;
    recommendations = 'Необходима усиленная защита. Полуденные часы пережидайте внутри помещения. Вне помещения оставайтесь в тени. ' +
      'Обязательно носите одежду с длинными рукавами, шляпу, пользуйтесь солнцезащитным кремом.';
  } else if (uvIndex >= MEDIUM_UV_INDEX) {
    dangerLevel = 'средний';
    dangerLevelIcon = WARNING_ICON;
    recommendations = 'Необходима защита. В полуденные часы оставайтесь в тени. ' +
      'Носите одежду с длинными рукавами и шляпу. Пользуйтесь солнцезащитным кремом.';
  } else {
    dangerLevel = 'низкий';
    dangerLevelIcon = NO_WARNING_ICON;
    recommendations = 'Защита не требуется. Пребывание вне помещения не представляет опасности.';
  }
  return `${dangerLevelIcon} Индекс УФ-излучения = ${uvIndex}, уровень опасности ${dangerLevel}. ${recommendations}`;
}

function getWeatherLine(weatherObject: Weather): string {
  const windSpeed = Math.round(weatherObject.wind.speed);
  const windWarningIcon = windSpeed >= HIGH_WIND_SPEED ? WARNING_ICON : '';
  let weatherLine = `${ weatherObject.weather[0].description }, ${ Math.round(weatherObject.main.temp) }°C, ` +
    `${windWarningIcon} ветер ${ windSpeed } м/с`;
  if (weatherObject.wind.gust) {
    const windGustSpeed = Math.round(weatherObject.wind.gust);
    const gustWarningIcon = windGustSpeed >= HIGH_WIND_SPEED && windSpeed < HIGH_WIND_SPEED ?
      WARNING_ICON :
      '';
    weatherLine += `, ${gustWarningIcon} порывы до ${ windGustSpeed } м/с`;
  }
  return weatherLine;
}

async function getAdsMessage(): Promise<string> {
  const response = await db.query<{key: string, value: string}>
  ('SELECT value FROM friends_vk_bot.state WHERE key = \'ads\';');
  return response.rows[0].value;
}

function finalStatisticsShouldBeShown(): boolean {
  return process.env.DEBUG_FINAL_STATISTICS === '1' || new Date().getDate() === 1;
}

function intermediateStatisticsShouldBeShown(): boolean {
  const today = new Date();
  return process.env.DEBUG_INTERMEDIATE_STATISTICS === '1' || today.getDate() === 11 || today.getDate() === 21;
}

function statisticsShouldBeReset(): boolean {
  return process.env.DEBUG_FINAL_STATISTICS !== '1' && new Date().getDate() === 1;
}

export default async () => {

  const stickersIDs = [
    16, 21, 28, 29, 30, 50, 52, 2079, 2770, 2778, 2780, 3003, 4323, 4343, 4346, 4535,
  ];

  const [ currentWeather, forecast, uvIndex, todayHolidays ] = await Promise.all([
    weather.getCurrentWeather(),
    weather.getForecast(),
    weather.getUvIndex(),
    holidays.getHolidays(),
  ]);

  console.log(`Weather: ${ util.inspect(currentWeather) }`);
  console.log(`Forecast: ${ util.inspect(forecast) }`);
  const weatherMessage = getWeatherMessage(currentWeather, forecast, uvIndex);

  const randomID = stickersIDs[Math.floor(Math.random() * stickersIDs.length)];
  console.log(`Sticker sent response: ${ await vk.sendSticker(randomID) }`);

  console.log(`Weather message: ${ weatherMessage }`);
  console.log(`Weather message sent response: ${ await vk.sendMessage(weatherMessage) }`);

  await holidaysOutputter.output(todayHolidays);

  const ads = await getAdsMessage();
  console.log(`Ads: ${ ads }`);
  if (ads) {
    console.log(`Ads message sent response: ${ await vk.sendMessage(ads) }`);
  }

  const statisticsObject = await getStatistics();
  if (statisticsObject) {
    if (finalStatisticsShouldBeShown()) {
      finalStatisticsOutputter.output(statisticsObject);
    } else if (intermediateStatisticsShouldBeShown()) {
      intermediateStatisticsOutputter.output(statisticsObject);
    }
  }
  if (statisticsShouldBeReset()) {
    await resetStatistics();
  }

};
