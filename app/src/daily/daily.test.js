let weatherMockResponse;
let forecastMockResponse;

beforeAll(async () => {
  let weather = require('./weather');
  weatherMockResponse = await weather.getCurrentWeather();
  forecastMockResponse = await weather.getForecast();

  jest.spyOn(global.Math, 'random').mockReturnValue(0.1);
});

beforeEach(() => {
  jest.doMock('./weather');
  const weather = require('./weather');
  weather.getCurrentWeather.mockReturnValue(weatherMockResponse);
  weather.getForecast.mockReturnValue(forecastMockResponse);

  jest.doMock('../vk/vk');
  const sender = require('../vk/vk');
  sender.sendSticker.mockResolvedValue('ok');
  sender.sendMessage.mockResolvedValue('ok');
  sender.sendPhotoToChat.mockResolvedValue('ok');
});

afterEach(() => {
  jest.clearAllMocks();
  jest.resetModules();
});

function mockDatabaseCalls(ads) {
  jest.doMock('../db');
  const db = require('../db');
  db.query.mockImplementation(request => {
    if (request.includes('ads')) {
      return {
        rows: [{ value: ads }]
      };
    } else if (request.includes('absent_holidays_phrases')) {
      return {
        rows: [{ value: 'Сегодня праздников нет' }]
      };
    }
  });
}

function mockHolidays(holidays) {
  jest.doMock('./holidays');
  const holidaysModule = require('./holidays');
  holidaysModule.getHolidays.mockReturnValue(holidays);
}

function mockDate(date) {
  jest.useFakeTimers('modern')
      .setSystemTime(date);
}

function mockStatistics(statistics) {
  jest.doMock('../statistics/statistics');
  const statisticsModule = require('../statistics/statistics');
  statisticsModule.getStatistics.mockResolvedValue(statistics);
  statisticsModule.resetStatistics.mockResolvedValue();
  statisticsModule.getLeaderboardPhotos.mockImplementation(object => object.mostActiveUsers);
}

test('If holidays are present and ads is present and it is not first day of month, then 3 messages are sent to chat in correct order - weather, holidays, ads', async () => {
  mockDatabaseCalls('Ads message');
  mockHolidays(['Holiday 1']);
  mockDate(new Date(2020, 0, 10));
  const daily = require('./daily');
  const sender = require('../vk/vk');
  await daily();
  expect(sender.sendMessage).toHaveBeenCalledTimes(3);
  expect(sender.sendMessage.mock.calls[0][0]).toMatch(/Прогноз погоды/);
  expect(sender.sendMessage.mock.calls[1][0]).toMatch(/Holiday 1/);
  expect(sender.sendMessage.mock.calls[2][0]).toBe('Ads message');
});

test('If holidays are present and ads is not present and it is not first day of month, then 2 messages are sent to chat in correct order - weather, holidays', async () => {
  mockDatabaseCalls('');
  mockHolidays(['Holiday 1']);
  mockDate(new Date(2020, 0, 10));
  const daily = require('./daily');
  const sender = require('../vk/vk');
  await daily();
  expect(sender.sendMessage).toHaveBeenCalledTimes(2);
  expect(sender.sendMessage.mock.calls[0][0]).toMatch(/Прогноз погоды/);
  expect(sender.sendMessage.mock.calls[1][0]).toMatch(/Holiday 1/);
});

test('If holidays are not present and ads is present and it is not first day of month, then 3 messages are sent to chat in correct order - weather, no holidays message, ads', async () => {
  mockDatabaseCalls('Ads other message');
  mockHolidays([]);
  mockDate(new Date(2020, 0, 10));
  const daily = require('./daily');
  const sender = require('../vk/vk');
  await daily();
  expect(sender.sendMessage).toHaveBeenCalledTimes(3);
  expect(sender.sendMessage.mock.calls[0][0]).toMatch(/Прогноз погоды/);
  expect(sender.sendMessage.mock.calls[1][0]).toMatch(/Сегодня праздников нет/);
  expect(sender.sendMessage.mock.calls[2][0]).toBe('Ads other message');
});

test('If holidays are not present and ads is not present and it is not first day of month, then 2 messages are sent to chat in correct order - weather, no holidays message', async () => {
  mockDatabaseCalls('');
  mockHolidays([]);
  mockDate(new Date(2020, 0, 10));
  const daily = require('./daily');
  const sender = require('../vk/vk');
  await daily();
  expect(sender.sendMessage).toHaveBeenCalledTimes(2);
  expect(sender.sendMessage.mock.calls[0][0]).toMatch(/Прогноз погоды/);
  expect(sender.sendMessage.mock.calls[1][0]).toMatch(/Сегодня праздников нет/);
});

test('Holiday message is correct if 1 holiday is celebrated today', async () => {
  mockDatabaseCalls('');
  mockHolidays(['Holiday 1']);
  mockDate(new Date(2020, 0, 10));
  const daily = require('./daily');
  const sender = require('../vk/vk');
  await daily();
  expect(sender.sendMessage.mock.calls[1][0]).toMatch(/сегодня Holiday 1\?/);
});

test('Holiday message is correct if 2 holidays are celebrated today', async () => {
  mockDatabaseCalls('');
  mockHolidays(['Holiday 1', 'Holiday 2']);
  mockDate(new Date(2020, 0, 10));
  const daily = require('./daily');
  const sender = require('../vk/vk');
  await daily();
  expect(sender.sendMessage.mock.calls[1][0]).toMatch(/сегодня Holiday 1 и Holiday 2\?/);
});

test('Holiday message is correct if 3 holidays are celebrated today', async () => {
  mockDatabaseCalls('');
  mockHolidays(['Holiday 1', 'Holiday 2', 'Holiday 3']);
  mockDate(new Date(2020, 0, 10));
  const daily = require('./daily');
  const sender = require('../vk/vk');
  await daily();
  expect(sender.sendMessage.mock.calls[1][0]).toMatch(/сегодня Holiday 1, Holiday 2 и Holiday 3\?/);
});

test('Holiday message is correct if 4 holidays are celebrated today', async () => {
  mockDatabaseCalls('');
  mockHolidays(['Holiday 1', 'Holiday 2', 'Holiday 3', 'Holiday 4']);
  mockDate(new Date(2020, 0, 10));
  const daily = require('./daily');
  const sender = require('../vk/vk');
  await daily();
  expect(sender.sendMessage.mock.calls[1][0]).toMatch(/сегодня Holiday 1, Holiday 2, Holiday 3 и Holiday 4\?/);
});

test('If it is first day of month, statistics are shown for previous month', async () => {
  mockDatabaseCalls('');
  mockHolidays([]);
  mockDate(new Date(2020, 0, 1));
  mockStatistics({
    totalAmount: 0,
    audioMessagesAmount: 0,
    stickersAmount: 0,
    repostsAmount: 0,
    mostActiveUsers: [],
    previousMonthAmount: -1,
  });
  const daily = require('./daily');
  const sender = require('../vk/vk');
  await daily();
  expect(sender.sendMessage.mock.calls[2][0]).toMatch(/Статистика/);
});

test('If it is first day of month, statistics are reset', async () => {
  mockDatabaseCalls('');
  mockHolidays([]);
  mockDate(new Date(2020, 0, 1));
  mockStatistics({
    totalAmount: 0,
    audioMessagesAmount: 0,
    stickersAmount: 0,
    repostsAmount: 0,
    mostActiveUsers: [],
    previousMonthAmount: -1,
  });
  const daily = require('./daily');
  const statistics = require('../statistics/statistics');
  await daily();
  expect(statistics.resetStatistics).toHaveBeenCalled();
});

test('Bot correctly displays statistics for previous month', async () => {
  mockDatabaseCalls('');
  mockHolidays([]);
  mockDate(new Date(2020, 0, 1));
  mockStatistics({
    totalAmount: 100,
    audioMessagesAmount: 10,
    stickersAmount: 20,
    repostsAmount: 5,
    mostActiveUsers: [],
    previousMonthAmount: -1,
  });
  const daily = require('./daily');
  const sender = require('../vk/vk');
  await daily();
  expect(sender.sendMessage.mock.calls[2][0]).toMatch(/Статистика беседы за декабрь/);
  expect(sender.sendMessage.mock.calls[2][0]).toMatch(/100 сообщений/);
  expect(sender.sendMessage.mock.calls[2][0]).toMatch(/10 голосовых сообщений/);
  expect(sender.sendMessage.mock.calls[2][0]).toMatch(/20 стикеров/);
  expect(sender.sendMessage.mock.calls[2][0]).toMatch(/5 репостов/);
});

test('Bot correctly displays changes in comparison to month before previous one (case when equals)', async () => {
  mockDatabaseCalls('');
  mockHolidays([]);
  mockDate(new Date(2020, 0, 1));
  mockStatistics({
    totalAmount: 100,
    audioMessagesAmount: 10,
    stickersAmount: 20,
    repostsAmount: 5,
    mostActiveUsers: [],
    previousMonthAmount: 100,
  });
  const daily = require('./daily');
  const sender = require('../vk/vk');
  await daily();
  expect(sender.sendMessage.mock.calls[2][0]).toMatch(/не изменилось/);
});

test('Bot correctly displays changes in comparison to month before previous one (case when increased insignificantly)', async () => {
  mockDatabaseCalls('');
  mockHolidays([]);
  mockDate(new Date(2020, 0, 1));
  mockStatistics({
    totalAmount: 500,
    audioMessagesAmount: 10,
    stickersAmount: 20,
    repostsAmount: 5,
    mostActiveUsers: [],
    previousMonthAmount: 499,
  });
  const daily = require('./daily');
  const sender = require('../vk/vk');
  await daily();
  expect(sender.sendMessage.mock.calls[2][0]).toMatch(/незначительно увеличилось/);
});

test('Bot correctly displays changes in comparison to month before previous one (case when decreased insignificantly)', async () => {
  mockDatabaseCalls('');
  mockHolidays([]);
  mockDate(new Date(2020, 0, 1));
  mockStatistics({
    totalAmount: 500,
    audioMessagesAmount: 10,
    stickersAmount: 20,
    repostsAmount: 5,
    mostActiveUsers: [],
    previousMonthAmount: 501,
  });
  const daily = require('./daily');
  const sender = require('../vk/vk');
  await daily();
  expect(sender.sendMessage.mock.calls[2][0]).toMatch(/незначительно уменьшилось/);
});

test('Bot correctly displays changes in comparison to month before previous one (case when increased significantly)', async () => {
  mockDatabaseCalls('');
  mockHolidays([]);
  mockDate(new Date(2020, 0, 1));
  mockStatistics({
    totalAmount: 550,
    audioMessagesAmount: 10,
    stickersAmount: 20,
    repostsAmount: 5,
    mostActiveUsers: [],
    previousMonthAmount: 500,
  });
  const daily = require('./daily');
  const sender = require('../vk/vk');
  await daily();
  expect(sender.sendMessage.mock.calls[2][0]).toMatch(/увеличилось на 10%/);
});

test('Bot correctly displays changes in comparison to month before previous one (case when decreased significantly)', async () => {
  mockDatabaseCalls('');
  mockHolidays([]);
  mockDate(new Date(2020, 0, 1));
  mockStatistics({
    totalAmount: 450,
    audioMessagesAmount: 10,
    stickersAmount: 20,
    repostsAmount: 5,
    mostActiveUsers: [],
    previousMonthAmount: 500,
  });
  const daily = require('./daily');
  const sender = require('../vk/vk');
  await daily();
  expect(sender.sendMessage.mock.calls[2][0]).toMatch(/уменьшилось на 10%/);
});

test('Bot correctly displays name of month before previous one', async () => {
  mockDatabaseCalls('');
  mockHolidays([]);
  mockDate(new Date(2020, 0, 1));
  mockStatistics({
    totalAmount: 100,
    audioMessagesAmount: 10,
    stickersAmount: 20,
    repostsAmount: 5,
    mostActiveUsers: [],
    previousMonthAmount: 100,
  });
  const daily = require('./daily');
  const sender = require('../vk/vk');
  await daily();
  expect(sender.sendMessage.mock.calls[2][0]).toMatch(/с ноябрём/);
});

test('Bot correctly handles case when there is no statistics for month before previous one', async () => {
  mockDatabaseCalls('');
  mockHolidays([]);
  mockDate(new Date(2020, 0, 1));
  mockStatistics({
    totalAmount: 100,
    audioMessagesAmount: 10,
    stickersAmount: 20,
    repostsAmount: 5,
    mostActiveUsers: [],
    previousMonthAmount: null,
  });
  const daily = require('./daily');
  const sender = require('../vk/vk');
  await daily();
  expect(sender.sendMessage.mock.calls[2][0]).not.toMatch(/общее количество сообщений/);
});

test('Bot correctly handles case when there were zero messages in month before previous one', async () => {
  mockDatabaseCalls('');
  mockHolidays([]);
  mockDate(new Date(2020, 0, 1));
  mockStatistics({
    totalAmount: 200,
    audioMessagesAmount: 10,
    stickersAmount: 20,
    repostsAmount: 5,
    mostActiveUsers: [],
    previousMonthAmount: 0,
  });
  const daily = require('./daily');
  const sender = require('../vk/vk');
  await daily();
  expect(sender.sendMessage.mock.calls[2][0]).toMatch(/увеличилось на ∞%/);
});

test('Bot correctly handles case when there were zero messages in previous month', async () => {
  mockDatabaseCalls('');
  mockHolidays([]);
  mockDate(new Date(2020, 0, 1));
  mockStatistics({
    totalAmount: 0,
    audioMessagesAmount: 0,
    stickersAmount: 0,
    repostsAmount: 0,
    mostActiveUsers: [],
    previousMonthAmount: 200,
  });
  const daily = require('./daily');
  const sender = require('../vk/vk');
  await daily();
  expect(sender.sendMessage.mock.calls[2][0]).toMatch(/уменьшилось на 100%/);
});

test('Bot correctly handles case when there were zero messages in month before previous one and zero messages in previous month', async () => {
  mockDatabaseCalls('');
  mockHolidays([]);
  mockDate(new Date(2020, 0, 1));
  mockStatistics({
    totalAmount: 0,
    audioMessagesAmount: 0,
    stickersAmount: 0,
    repostsAmount: 0,
    mostActiveUsers: [],
    previousMonthAmount: 0,
  });
  const daily = require('./daily');
  const sender = require('../vk/vk');
  await daily();
  expect(sender.sendMessage.mock.calls[2][0]).toMatch(/не изменилось/);
});

test('Bot correctly shows most active users (case with one user)', async () => {
  mockDatabaseCalls('');
  mockHolidays([]);
  mockDate(new Date(2020, 0, 1));
  mockStatistics({
    totalAmount: 200,
    audioMessagesAmount: 10,
    stickersAmount: 20,
    repostsAmount: 5,
    mostActiveUsers: [{ first_name: 'Арсений' }],
    previousMonthAmount: 0,
  });
  const daily = require('./daily');
  const sender = require('../vk/vk');
  await daily();
  expect(sender.sendMessage.mock.calls[2][0]).toMatch(/Самый активный участник/);
  expect(sender.sendMessage.mock.calls[2][0]).toMatch(/Арсений/);
  expect(sender.sendPhotoToChat).toHaveBeenCalledTimes(1);
});

test('Bot correctly shows most active users (case with two users)', async () => {
  mockDatabaseCalls('');
  mockHolidays([]);
  mockDate(new Date(2020, 0, 1));
  mockStatistics({
    totalAmount: 200,
    audioMessagesAmount: 10,
    stickersAmount: 20,
    repostsAmount: 5,
    mostActiveUsers: [ { first_name: 'Арсений' }, { first_name: 'Борис' } ],
    previousMonthAmount: 0,
  });
  const daily = require('./daily');
  const sender = require('../vk/vk');
  await daily();
  expect(sender.sendMessage.mock.calls[2][0]).toMatch(/Самые активные участники/);
  expect(sender.sendMessage.mock.calls[2][0]).toMatch(/Арсений/);
  expect(sender.sendMessage.mock.calls[2][0]).toMatch(/Борис/);
  expect(sender.sendPhotoToChat).toHaveBeenCalledTimes(2);
});

test('Bot does not show most active users if there were no messages in previous month', async () => {
  mockDatabaseCalls('');
  mockHolidays([]);
  mockDate(new Date(2020, 0, 1));
  mockStatistics({
    totalAmount: 0,
    audioMessagesAmount: 0,
    stickersAmount: 0,
    repostsAmount: 0,
    mostActiveUsers: [],
    previousMonthAmount: 0,
  });
  const daily = require('./daily');
  const sender = require('../vk/vk');
  await daily();
  expect(sender.sendMessage.mock.calls[2][0]).not.toMatch(/Самые активные участники/);
  expect(sender.sendMessage.mock.calls[2][0]).not.toMatch(/Самый активный участник/);
  expect(sender.sendPhotoToChat).not.toHaveBeenCalled();
});

test('If it is not first day of month, statistics are not shown for previous month', async () => {
  mockDatabaseCalls('');
  mockHolidays([]);
  mockDate(new Date(2020, 0, 10));
  const daily = require('./daily');
  const sender = require('../vk/vk');
  await daily();
  expect(sender.sendMessage.mock.calls[2]).toBeUndefined();
});

test('If it is not first day of month, statistics are not reset', async () => {
  mockDatabaseCalls('');
  mockHolidays([]);
  mockDate(new Date(2020, 0, 10));
  const daily = require('./daily');
  const statistics = require('../statistics/statistics');
  await daily();
  expect(statistics.resetStatistics).not.toHaveBeenCalled();
});