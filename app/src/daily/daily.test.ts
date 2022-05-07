import weather from './weather';
import holidays from './holidays';
import vk from '../vk/vk';
import db from '../db';
import * as statistics from '../statistics/statistics';
import daily from './daily';
import {weatherForecastResponse, weatherResponse} from './test-resources/weather-response';
import {QueryResult} from 'pg';
import {Weather} from './model/Weather';
import {WeatherForecast} from './model/WeatherForecast';
import * as statisticsObjects from './test-resources/statistics-objects';

process.env.DEBUG_STATISTICS = '0';
jest.spyOn(global.Math, 'random').mockReturnValue(0.1);
jest.mock('./weather');
jest.mock('./holidays');
jest.mock('../vk/vk');
jest.mock('../db');
jest.mock('../statistics/statistics');

jest.useFakeTimers('modern');

enum MessagesOrder {
  WEATHER,
  HOLIDAYS,
  CUSTOM_DAILY_MESSAGE,
  STATISTICS,
} 

const sendStickerSpy = jest.spyOn(vk, 'sendSticker').mockResolvedValue(true);
const sendMessageSpy = jest.spyOn(vk, 'sendMessage').mockResolvedValue(true);
const sendPhotoToChatSpy = jest.spyOn(vk, 'sendPhotoToChat').mockResolvedValue();

function mockWeather(weatherResponse: Weather | undefined, weatherForecastResponse: WeatherForecast | undefined) {
  jest.spyOn(weather, 'getCurrentWeather').mockResolvedValue(weatherResponse);
  jest.spyOn(weather, 'getForecast').mockResolvedValue(weatherForecastResponse);
}

function mockHolidays(holidaysList: string[] | undefined): void {
  jest.spyOn(holidays, 'getHolidays').mockResolvedValue(holidaysList);
}

// TODO: use model for statistics
function mockStatistics(statisticsObject: any): void {
  jest.spyOn(statistics, 'getStatistics').mockResolvedValue(statisticsObject);
  jest.spyOn(statistics, 'resetStatistics').mockResolvedValue();
  jest.spyOn(statistics, 'getLeaderboardPhotos').mockImplementation(object => object.mostActiveUsers);
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
    mockWeather(undefined, undefined);
    mockHolidays(undefined);
    mockDatabaseCalls('');
    mockDate(new Date(2020, 0, 10));
    await daily();
    expect(sendStickerSpy).toHaveBeenCalledTimes(1);
  });
});

describe('Weather forecast', () => {
  beforeAll(() => {
    mockHolidays(undefined);
    mockDatabaseCalls('');
    mockDate(new Date(2020, 0, 10));
  });

  test('If weather is available, bot sends weather to chat', async () => {
    mockWeather(weatherResponse, weatherForecastResponse);
    await daily();
    expect(sendMessageSpy.mock.calls[MessagesOrder.WEATHER][0]).toMatch(/Прогноз погоды на сегодня/);
  });

  test('If weather is not available, bot sends failure message to chat', async () => {
    mockWeather(undefined, undefined);
    await daily();
    expect(sendMessageSpy.mock.calls[MessagesOrder.WEATHER][0]).toMatch(/Я не смог узнать прогноз погоды/);
  });
});

describe('Holidays', () => {
  beforeAll(() => {
    mockWeather(undefined, undefined);
    mockDatabaseCalls('');
    mockDate(new Date(2020, 0, 10));
  });

  test('If holidays are available and present, bot sends holidays list to chat', async () => {
    mockHolidays(['Новый год']);
    await daily();
    expect(sendMessageSpy.mock.calls[MessagesOrder.HOLIDAYS][0]).toMatch(/Новый год/);
  });

  test('If holidays are available and not present, bot sends no holidays message to chat', async () => {
    mockHolidays([]);
    const noHolidaysMessage = 'Сегодня праздников нет';
    mockDatabaseCalls(noHolidaysMessage);
    await daily();
    expect(sendMessageSpy.mock.calls[MessagesOrder.HOLIDAYS][0]).toMatch(noHolidaysMessage);
  });

  test('If holidays are not available, bot sends failure message to chat', async () => {
    mockHolidays(undefined);
    await daily();
    expect(sendMessageSpy.mock.calls[MessagesOrder.HOLIDAYS][0]).toMatch('Я не смог узнать, какие сегодня праздники');
  });
});

describe('Custom daily message', () => {
  beforeAll(() => {
    mockWeather(undefined, undefined);
    mockHolidays(['Новый год']);
    mockDate(new Date(2020, 0, 10));
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
    mockWeather(undefined, undefined);
    mockHolidays(['Новый год']);
    mockDatabaseCalls('Custom daily message');
  });

  describe('First day of month', () => {
    beforeAll(() => {
      mockDate(new Date(2020, 0, 1));
    });

    test('Statistics are shown for previous month', async () => {
      mockStatistics(statisticsObjects.commonExample);
      await daily();
      expect(sendMessageSpy.mock.calls[MessagesOrder.STATISTICS][0]).toMatch('Статистика');
    });

    test('Statistics are reset', async () => {
      mockStatistics(statisticsObjects.commonExample);
      await daily();
      expect(statistics.resetStatistics).toHaveBeenCalled();
    });

    test('Bot correctly displays statistics for previous month', async () => {
      mockStatistics(statisticsObjects.commonExample);
      await daily();
      expect(sendMessageSpy.mock.calls[MessagesOrder.STATISTICS][0]).toMatch('Статистика беседы за декабрь');
      expect(sendMessageSpy.mock.calls[MessagesOrder.STATISTICS][0]).toMatch('100 сообщений');
      expect(sendMessageSpy.mock.calls[MessagesOrder.STATISTICS][0]).toMatch('10 голосовых сообщений');
      expect(sendMessageSpy.mock.calls[MessagesOrder.STATISTICS][0]).toMatch('20 стикеров');
      expect(sendMessageSpy.mock.calls[MessagesOrder.STATISTICS][0]).toMatch('5 репостов');
    });

    test('Bot correctly displays changes in comparison to month before previous one (case when equals)', async () => {
      mockStatistics(statisticsObjects.totalEqualToPrevMonth);
      await daily();
      expect(sendMessageSpy.mock.calls[MessagesOrder.STATISTICS][0]).toMatch('не изменилось');
    });

    test('Bot correctly displays changes in comparison to month before previous one (case when increased insignificantly)', async () => {
      mockStatistics(statisticsObjects.totalIncreasedInsignificantly);
      await daily();
      expect(sendMessageSpy.mock.calls[MessagesOrder.STATISTICS][0]).toMatch('незначительно увеличилось');
    });

    test('Bot correctly displays changes in comparison to month before previous one (case when decreased insignificantly)', async () => {
      mockStatistics(statisticsObjects.totalDecreasedInsignificantly);
      await daily();
      expect(sendMessageSpy.mock.calls[MessagesOrder.STATISTICS][0]).toMatch('незначительно уменьшилось');
    });

    test('Bot correctly displays changes in comparison to month before previous one (case when increased significantly)', async () => {
      mockStatistics(statisticsObjects.totalIncreasedSignificantly);
      await daily();
      expect(sendMessageSpy.mock.calls[MessagesOrder.STATISTICS][0]).toMatch('увеличилось на 10%');
    });

    test('Bot correctly displays changes in comparison to month before previous one (case when decreased significantly)', async () => {
      mockStatistics(statisticsObjects.totalDecreasedSignificantly);
      await daily();
      expect(sendMessageSpy.mock.calls[MessagesOrder.STATISTICS][0]).toMatch('уменьшилось на 10%');
    });

    test('Bot correctly displays name of month before previous one', async () => {
      mockStatistics(statisticsObjects.totalEqualToPrevMonth);
      await daily();
      expect(sendMessageSpy.mock.calls[MessagesOrder.STATISTICS][0]).toMatch('с ноябрём');
    });

    test('Bot correctly handles case when there is no statistics for month before previous one', async () => {
      mockStatistics(statisticsObjects.noDataForPrevPrevMonth);
      await daily();
      expect(sendMessageSpy.mock.calls[MessagesOrder.STATISTICS][0]).not.toMatch('общее количество сообщений');
    });

    test('Bot correctly handles case when there were zero messages in month before previous one', async () => {
      mockStatistics(statisticsObjects.zeroMessagesInPrevPrevMonth);
      await daily();
      expect(sendMessageSpy.mock.calls[MessagesOrder.STATISTICS][0]).toMatch('увеличилось на ∞%');
    });

    test('Bot correctly handles case when there were zero messages in previous month', async () => {
      mockStatistics(statisticsObjects.zeroMessagesInTotal);
      await daily();
      expect(sendMessageSpy.mock.calls[MessagesOrder.STATISTICS][0]).toMatch('уменьшилось на 100%');
    });

    test('Bot correctly handles case when there were zero messages in month before previous one ' +
               'and zero messages in previous month', async () => {
      mockStatistics(statisticsObjects.zeroMessagesInTotalAndInPrevPrevMonth);
      await daily();
      expect(sendMessageSpy.mock.calls[MessagesOrder.STATISTICS][0]).toMatch('не изменилось');
    });

    test('Bot correctly shows most active users (case with one user)', async () => {
      mockStatistics(statisticsObjects.oneMostActiveUser);
      await daily();
      expect(sendMessageSpy.mock.calls[MessagesOrder.STATISTICS][0]).toMatch('Самый активный участник');
      expect(sendMessageSpy.mock.calls[MessagesOrder.STATISTICS][0]).toMatch('Арсений');
      expect(sendPhotoToChatSpy).toHaveBeenCalledTimes(1);
    });

    test('Bot correctly shows most active users (case with two users)', async () => {
      mockStatistics(statisticsObjects.twoMostActiveUsers);
      await daily();
      expect(sendMessageSpy.mock.calls[MessagesOrder.STATISTICS][0]).toMatch('Самые активные участники');
      expect(sendMessageSpy.mock.calls[MessagesOrder.STATISTICS][0]).toMatch('Арсений');
      expect(sendMessageSpy.mock.calls[MessagesOrder.STATISTICS][0]).toMatch('Борис');
      expect(sendPhotoToChatSpy).toHaveBeenCalledTimes(2);
    });

    test('Bot does not show most active users if there were no messages in previous month', async () => {
      mockStatistics(statisticsObjects.zeroMessagesInTotal);
      await daily();
      expect(sendMessageSpy.mock.calls[MessagesOrder.STATISTICS][0]).not.toMatch('Самые активные участники');
      expect(sendMessageSpy.mock.calls[MessagesOrder.STATISTICS][0]).not.toMatch('Самый активный участник');
      expect(sendPhotoToChatSpy).not.toHaveBeenCalled();
    });
  });

  describe('Not first day of month', () => {
    beforeAll(() => {
      mockDate(new Date(2020, 0, 10));
    });

    test('Statistics are not shown for previous month', async () => {
      await daily();
      expect(sendMessageSpy.mock.calls[MessagesOrder.STATISTICS]).toBeUndefined();
      expect(sendPhotoToChatSpy).not.toHaveBeenCalled();
    });

    test('Statistics are not reset', async () => {
      await daily();
      expect(statistics.resetStatistics).not.toHaveBeenCalled();
    });

  });

});