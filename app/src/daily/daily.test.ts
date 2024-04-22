import weather from './weather/weather';
import holidays from './holidays/holidays';
import vk from '../vk/vk';
import db from '../db';
import * as statistics from '../statistics/statistics';
import daily from './daily';
import * as weatherResponses from './test-resources/weather-response';
import {QueryResult} from 'pg';
import {Weather} from './weather/model/Weather';
import {WeatherForecast} from './weather/model/WeatherForecast';
import * as statisticsObjects from '../statistics/test-resources/statistics-objects';
import {Statistics} from '../statistics/model/Statistics';
import {Month} from '../util';
import {HolidayCategory} from './holidays/model/HolidayCategory';
import {finalStatisticsOutputter} from '../statistics/outputters/final-statistics-outputter';
import {intermediateStatisticsOutputter} from '../statistics/outputters/intermediate-statistics-outputter';
import {holidaysOutputter} from './holidays/holidays-outputter';
import * as memes from '../memes/memes';

process.env.DEBUG_FINAL_STATISTICS = '0';
process.env.DEBUG_INTERMEDIATE_STATISTICS = '0';
process.env.VK_LEADERBOARD_ALBUM_ID = 'album_id';

jest.spyOn(global.Math, 'random').mockReturnValue(0.1);
jest.mock('./weather/weather');
jest.mock('./holidays/holidays');
jest.mock('../vk/vk');
jest.mock('../db');
jest.mock('../statistics/statistics');
jest.mock('../memes/memes');
jest.mock('../statistics/outputters/final-statistics-outputter');

jest.useFakeTimers();

enum MessagesOrder {
  WEATHER,
  CUSTOM_DAILY_MESSAGE,
} 

const sendStickerSpy = jest.spyOn(vk, 'sendSticker').mockResolvedValue(true);
const sendMessageSpy = jest.spyOn(vk, 'sendMessage').mockResolvedValue(true);
const holidaysOutputterSpy = jest.spyOn(holidaysOutputter, 'output').mockResolvedValue();
const finalStatisticsOutputterSpy = jest.spyOn(finalStatisticsOutputter, 'output').mockResolvedValue();
const intermediateStatisticsOutputterSpy = jest.spyOn(intermediateStatisticsOutputter, 'output').mockResolvedValue();
let getUvIndexSpy: jest.SpyInstance;

jest.spyOn(memes, 'getMemesStatistics').mockResolvedValue({
  topMemes: [],
});

function mockWeather(weatherResponse: Weather | null, weatherForecastResponse: WeatherForecast | null, uvIndex: number | null) {
  jest.spyOn(weather, 'getCurrentWeather').mockResolvedValue(weatherResponse);
  jest.spyOn(weather, 'getForecast').mockResolvedValue(weatherForecastResponse);
  getUvIndexSpy = jest.spyOn(weather, 'getUvIndex').mockResolvedValue(uvIndex);
}

function mockHolidays(holidaysMap: Map<HolidayCategory, string[]> | null): void {
  jest.spyOn(holidays, 'getHolidays').mockResolvedValue(holidaysMap);
}

function mockStatistics(statisticsObject: Statistics): void {
  jest.spyOn(statistics, 'getStatistics').mockResolvedValue(statisticsObject);
  jest.spyOn(statistics, 'resetStatistics').mockResolvedValue();
}

function mockDate(date: Date): void {
  jest.setSystemTime(date);
}

function mockDatabaseCalls(value: string): void {
  jest.spyOn(db, 'query').mockResolvedValue({
    rows: [{ value }]
  } as QueryResult);
}

describe('Sticker', () => {
  test('Bot sends sticker to chat', async () => {
    mockWeather(null, null, null);
    mockHolidays(null);
    mockDatabaseCalls('');
    mockDate(new Date(2020, Month.JANUARY, 10));
    await daily();
    expect(sendStickerSpy).toHaveBeenCalledTimes(1);
  });
});

describe('Weather forecast', () => {
  beforeAll(() => {
    mockHolidays(null);
    mockDatabaseCalls('');
    mockDate(new Date(2020, Month.JANUARY, 10));
  });

  test('If weather is available, bot sends weather to chat', async () => {
    mockWeather(weatherResponses.weatherResponseLowWindSpeed, weatherResponses.weatherForecastResponseLowWindSpeedLowGustSpeed, 0);
    await daily();
    expect(sendMessageSpy.mock.calls[MessagesOrder.WEATHER][0]).toMatch(/Прогноз погоды на сегодня/);
  });

  test('If weather is not available, bot sends failure message to chat', async () => {
    mockWeather(null, null, null);
    await daily();
    expect(sendMessageSpy.mock.calls[MessagesOrder.WEATHER][0]).toMatch(/Я не смог узнать прогноз погоды/);
  });

  describe('UV Index', () => {
    beforeAll(() => {
      mockDate(new Date(2020, Month.JUNE, 10));
    });

    test('Bot shows info about UV index during warm months', async () => {
      mockWeather(weatherResponses.weatherResponseLowWindSpeed, weatherResponses.weatherForecastResponseLowWindSpeedLowGustSpeed, 0);
      await daily();
      expect(sendMessageSpy.mock.calls[MessagesOrder.WEATHER][0]).toMatch(/Индекс УФ-излучения/);
    });

    test('Bot shows recommendations for low UV index', async () => {
      mockWeather(weatherResponses.weatherResponseLowWindSpeed, weatherResponses.weatherForecastResponseLowWindSpeedLowGustSpeed, 0);
      await daily();
      expect(sendMessageSpy.mock.calls[MessagesOrder.WEATHER][0]).toMatch(/Индекс УФ-излучения = 0, уровень опасности низкий/);
    });

    test('Bot shows recommendations for medium UV index', async () => {
      mockWeather(weatherResponses.weatherResponseLowWindSpeed, weatherResponses.weatherForecastResponseLowWindSpeedLowGustSpeed, 3);
      await daily();
      expect(sendMessageSpy.mock.calls[MessagesOrder.WEATHER][0]).toMatch(/Индекс УФ-излучения = 3, уровень опасности средний/);
    });

    test('Bot shows recommendations for high UV index', async () => {
      mockWeather(weatherResponses.weatherResponseLowWindSpeed, weatherResponses.weatherForecastResponseLowWindSpeedLowGustSpeed, 6);
      await daily();
      expect(sendMessageSpy.mock.calls[MessagesOrder.WEATHER][0]).toMatch(/Индекс УФ-излучения = 6, уровень опасности высокий/);
    });

    test('Bot does not show UV info if UV index is not available', async () => {
      mockWeather(weatherResponses.weatherResponseLowWindSpeed, weatherResponses.weatherForecastResponseLowWindSpeedLowGustSpeed, null);
      await daily();
      expect(sendMessageSpy.mock.calls[MessagesOrder.WEATHER][0]).not.toMatch(/Индекс УФ излучения/);
      expect(getUvIndexSpy).toHaveBeenCalled();
    });

    test('Bot does not show UV info during cold months', async () => {
      mockWeather(weatherResponses.weatherResponseLowWindSpeed, weatherResponses.weatherForecastResponseLowWindSpeedLowGustSpeed, 1);
      mockDate(new Date(2020, Month.JANUARY, 10));
      await daily();
      expect(sendMessageSpy.mock.calls[MessagesOrder.WEATHER][0]).not.toMatch(/Индекс УФ-излучения/);
    });
  });

  describe('Wind speed', () => {
    test('Bot shows warning icon if wind speed is high', async () => {
      mockWeather(weatherResponses.weatherResponseHighWindSpeed, weatherResponses.weatherForecastResponseLowWindSpeedLowGustSpeed, null);
      await daily();
      expect(sendMessageSpy.mock.calls[MessagesOrder.WEATHER][0]).toMatch(/⚠ ветер 10 м\/с/);

      mockWeather(weatherResponses.weatherResponseLowWindSpeed, weatherResponses.weatherForecastResponseHighWindSpeedHighGustSpeed, null);
      await daily();
      expect(sendMessageSpy.mock.calls[MessagesOrder.WEATHER][0]).toMatch(/⚠ ветер 10 м\/с/);
    });

    test('Bot shows warning icon if gust speed is high', async () => {
      mockWeather(weatherResponses.weatherResponseLowWindSpeed, weatherResponses.weatherForecastResponseLowWindSpeedHighGustSpeed, null);
      await daily();
      expect(sendMessageSpy.mock.calls[MessagesOrder.WEATHER][0]).toMatch(/⚠ порывы до 10 м\/с/);
    });

    test('Bot shows only one warning icon if both wind speed and gust speed are high', async () => {
      mockWeather(weatherResponses.weatherResponseLowWindSpeed, weatherResponses.weatherForecastResponseHighWindSpeedHighGustSpeed, null);
      await daily();
      expect(sendMessageSpy.mock.calls[MessagesOrder.WEATHER][0]).toMatch(/⚠ ветер 10 м\/с/);
      expect(sendMessageSpy.mock.calls[MessagesOrder.WEATHER][0]).toMatch(/порывы/);
      expect(sendMessageSpy.mock.calls[MessagesOrder.WEATHER][0]).not.toMatch(/⚠ порывы/);
    });

    test('Bot does not show warning icon if both wind speed and gust speed are low', async () => {
      mockWeather(weatherResponses.weatherResponseLowWindSpeed, weatherResponses.weatherForecastResponseLowWindSpeedLowGustSpeed, null);
      await daily();
      expect(sendMessageSpy.mock.calls[MessagesOrder.WEATHER][0]).not.toMatch(/⚠/);
    });

  });
});

describe('Holidays', () => {
  beforeAll(() => {
    mockWeather(null, null, null);
    mockDatabaseCalls('');
    mockDate(new Date(2020, Month.JANUARY, 10));
  });

  test('Holidays info is shown', async () => {
    await daily();
    expect(holidaysOutputterSpy).toHaveBeenCalledTimes(1);
  });
});

describe('Custom daily message', () => {
  beforeAll(() => {
    mockWeather(null, null, null);
    mockHolidays(null);
    mockDate(new Date(2020, Month.JANUARY, 10));
  });

  test('If custom daily message is set, bot sends custom daily message to chat', async () => {
    const customDailyMessage = 'Custom daily message';
    mockDatabaseCalls(customDailyMessage);
    await daily();
    expect(sendMessageSpy.mock.calls[MessagesOrder.CUSTOM_DAILY_MESSAGE][0]).toMatch(customDailyMessage);
  });

  test('If custom daily message is not set, bot does not send custom daily message to chat', async () => {
    const customDailyMessage = '';
    mockDatabaseCalls(customDailyMessage);
    await daily();
    expect(sendMessageSpy.mock.calls[MessagesOrder.CUSTOM_DAILY_MESSAGE]).toBeUndefined();
  });
});

describe('Statistics', () => {
  beforeAll(() =>{
    mockWeather(null, null, null);
    mockHolidays(null);
    mockDatabaseCalls('Custom daily message');
    mockStatistics(statisticsObjects.commonExample);
  });

  describe('First day of month', () => {
    beforeAll(() => {
      mockDate(new Date(2020, Month.JANUARY, 1));
    });

    test('Final statistics for previous month are shown', async () => {
      await daily();
      expect(finalStatisticsOutputterSpy).toHaveBeenCalled();
    });

    test('Intermediate statistics for current month are not shown', async () => {
      await daily();
      expect(intermediateStatisticsOutputterSpy).not.toHaveBeenCalled();
    });

    test('Statistics are reset', async () => {
      await daily();
      expect(statistics.resetStatistics).toHaveBeenCalled();
    });

  });

  for (const day of [11, 21]) {
    describe(`Day of month #${day}`, () => {
      beforeAll(() => {
        mockDate(new Date(2020, Month.JANUARY, day));
      });

      test('Final statistics for previous month are not shown', async () => {
        await daily();
        expect(finalStatisticsOutputterSpy).not.toHaveBeenCalled();
      });

      test('Intermediate statistics for current month are shown', async () => {
        await daily();
        expect(intermediateStatisticsOutputterSpy).toHaveBeenCalled();
      });

      test('Statistics are not reset', async () => {
        await daily();
        expect(statistics.resetStatistics).not.toHaveBeenCalled();
      });

    });

  }

  describe('Random day of month', () => {
    beforeAll(() => {
      mockDate(new Date(2020, Month.JANUARY, 10));
    });

    test('Final statistics for previous month are not shown', async () => {
      await daily();
      expect(finalStatisticsOutputterSpy).not.toHaveBeenCalled();
    });

    test('Intermediate statistics for current month are not shown', async () => {
      await daily();
      expect(intermediateStatisticsOutputterSpy).not.toHaveBeenCalled();
    });

    test('Statistics are not reset', async () => {
      await daily();
      expect(statistics.resetStatistics).not.toHaveBeenCalled();
    });

  });

});
