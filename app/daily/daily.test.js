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

  jest.doMock('../vk');
  const sender = require('../vk');
  sender.sendSticker.mockResolvedValue('ok');
  sender.sendMessage.mockResolvedValue('ok');
});

afterEach(() => {
  jest.clearAllMocks();
  jest.resetModules();
});

function mockAds(ads) {
  jest.doMock('../db');
  const db = require('../db');
  db.query.mockReturnValue({
    rows: [{ value: ads }],
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
}

test('If holidays are present and ads is present and it is not first day of month, then 3 messages are sent to chat in correct order - weather, holidays, ads', async () => {
  mockAds('Ads message');
  mockHolidays(['Holiday 1']);
  mockDate(new Date(2020, 0, 10));
  const daily = require('./daily');
  const sender = require('../vk');
  await daily();
  expect(sender.sendMessage).toHaveBeenCalledTimes(3);
  expect(sender.sendMessage.mock.calls[0][0]).toMatch(/Прогноз погоды/);
  expect(sender.sendMessage.mock.calls[1][0]).toMatch(/Holiday 1/);
  expect(sender.sendMessage.mock.calls[2][0]).toBe('Ads message');
});

test('If holidays are present and ads is not present and it is not first day of month, then 2 messages are sent to chat in correct order - weather, holidays', async () => {
  mockAds('');
  mockHolidays(['Holiday 1']);
  mockDate(new Date(2020, 0, 10));
  const daily = require('./daily');
  const sender = require('../vk');
  await daily();
  expect(sender.sendMessage).toHaveBeenCalledTimes(2);
  expect(sender.sendMessage.mock.calls[0][0]).toMatch(/Прогноз погоды/);
  expect(sender.sendMessage.mock.calls[1][0]).toMatch(/Holiday 1/);
});

test('If holidays are not present and ads is present and it is not first day of month, then 2 messages are sent to chat in correct order - weather, ads', async () => {
  mockAds('Ads other message');
  mockHolidays([]);
  mockDate(new Date(2020, 0, 10));
  const daily = require('./daily');
  const sender = require('../vk');
  await daily();
  expect(sender.sendMessage).toHaveBeenCalledTimes(2);
  expect(sender.sendMessage.mock.calls[0][0]).toMatch(/Прогноз погоды/);
  expect(sender.sendMessage.mock.calls[1][0]).toBe('Ads other message');
});

test('If holidays are not present and ads is not present and it is not first day of month, then only a weather message is sent', async () => {
  mockAds('');
  mockHolidays([]);
  mockDate(new Date(2020, 0, 10));
  const daily = require('./daily');
  const sender = require('../vk');
  await daily();
  expect(sender.sendMessage).toHaveBeenCalledTimes(1);
  expect(sender.sendMessage.mock.calls[0][0]).toMatch(/Прогноз погоды/);
});

test('Holiday message is correct if 1 holiday is celebrated today', async () => {
  mockAds('');
  mockHolidays(['Holiday 1']);
  mockDate(new Date(2020, 0, 10));
  const daily = require('./daily');
  const sender = require('../vk');
  await daily();
  expect(sender.sendMessage.mock.calls[1][0]).toMatch(/сегодня Holiday 1\?/);
});

test('Holiday message is correct if 2 holidays are celebrated today', async () => {
  mockAds('');
  mockHolidays(['Holiday 1', 'Holiday 2']);
  mockDate(new Date(2020, 0, 10));
  const daily = require('./daily');
  const sender = require('../vk');
  await daily();
  expect(sender.sendMessage.mock.calls[1][0]).toMatch(/сегодня Holiday 1 и Holiday 2\?/);
});

test('Holiday message is correct if 3 holidays are celebrated today', async () => {
  mockAds('');
  mockHolidays(['Holiday 1', 'Holiday 2', 'Holiday 3']);
  mockDate(new Date(2020, 0, 10));
  const daily = require('./daily');
  const sender = require('../vk');
  await daily();
  expect(sender.sendMessage.mock.calls[1][0]).toMatch(/сегодня Holiday 1, Holiday 2 и Holiday 3\?/);
});

test('Holiday message is correct if 4 holidays are celebrated today', async () => {
  mockAds('');
  mockHolidays(['Holiday 1', 'Holiday 2', 'Holiday 3', 'Holiday 4']);
  mockDate(new Date(2020, 0, 10));
  const daily = require('./daily');
  const sender = require('../vk');
  await daily();
  expect(sender.sendMessage.mock.calls[1][0]).toMatch(/сегодня Holiday 1, Holiday 2, Holiday 3 и Holiday 4\?/);
});

test('If it is first day of month, statistics are shown for previous month', async () => {
  mockAds('');
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
  const sender = require('../vk');
  await daily();
  expect(sender.sendMessage.mock.calls[1][0]).toMatch(/Статистика/);
});

test('If it is first day of month, statistics are reset', async () => {
  mockAds('');
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
  mockAds('');
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
  const sender = require('../vk');
  await daily();
  expect(sender.sendMessage.mock.calls[1][0]).toMatch(/Статистика беседы за декабрь/);
  expect(sender.sendMessage.mock.calls[1][0]).toMatch(/100 сообщений/);
  expect(sender.sendMessage.mock.calls[1][0]).toMatch(/10 голосовых сообщений/);
  expect(sender.sendMessage.mock.calls[1][0]).toMatch(/20 стикеров/);
  expect(sender.sendMessage.mock.calls[1][0]).toMatch(/5 репостов/);
});

test('Bot correctly displays changes in comparison to month before previous one (case when equals)', async () => {
  mockAds('');
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
  const sender = require('../vk');
  await daily();
  expect(sender.sendMessage.mock.calls[1][0]).toMatch(/не изменилось/);
});

test('Bot correctly displays changes in comparison to month before previous one (case when increased insignificantly)', async () => {
  mockAds('');
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
  const sender = require('../vk');
  await daily();
  expect(sender.sendMessage.mock.calls[1][0]).toMatch(/незначительно увеличилось/);
});

test('Bot correctly displays changes in comparison to month before previous one (case when decreased insignificantly)', async () => {
  mockAds('');
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
  const sender = require('../vk');
  await daily();
  expect(sender.sendMessage.mock.calls[1][0]).toMatch(/незначительно уменьшилось/);
});

test('Bot correctly displays changes in comparison to month before previous one (case when increased significantly)', async () => {
  mockAds('');
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
  const sender = require('../vk');
  await daily();
  expect(sender.sendMessage.mock.calls[1][0]).toMatch(/увеличилось на 10%/);
});

test('Bot correctly displays changes in comparison to month before previous one (case when decreased significantly)', async () => {
  mockAds('');
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
  const sender = require('../vk');
  await daily();
  expect(sender.sendMessage.mock.calls[1][0]).toMatch(/уменьшилось на 10%/);
});

test('Bot correctly displays name of month before previous one', async () => {
  mockAds('');
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
  const sender = require('../vk');
  await daily();
  expect(sender.sendMessage.mock.calls[1][0]).toMatch(/с ноябрём/);
});

test('Bot correctly handles case when there is no statistics for month before previous one', async () => {
  mockAds('');
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
  const sender = require('../vk');
  await daily();
  expect(sender.sendMessage.mock.calls[1][0]).not.toMatch(/общее количество сообщений/);
});

test('Bot correctly handles case when there were zero messages in month before previous one', async () => {
  mockAds('');
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
  const sender = require('../vk');
  await daily();
  expect(sender.sendMessage.mock.calls[1][0]).toMatch(/увеличилось на ∞%/);
});

test('Bot correctly handles case when there were zero messages in previous month', async () => {
  mockAds('');
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
  const sender = require('../vk');
  await daily();
  expect(sender.sendMessage.mock.calls[1][0]).toMatch(/уменьшилось на 100%/);
});

test('Bot correctly handles case when there were zero messages in month before previous one and zero messages in previous month', async () => {
  mockAds('');
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
  const sender = require('../vk');
  await daily();
  expect(sender.sendMessage.mock.calls[1][0]).toMatch(/не изменилось/);
});

test('Bot correctly shows most active users (case with one user)', async () => {
  mockAds('');
  mockHolidays([]);
  mockDate(new Date(2020, 0, 1));
  mockStatistics({
    totalAmount: 200,
    audioMessagesAmount: 10,
    stickersAmount: 20,
    repostsAmount: 5,
    mostActiveUsers: [ 2222 ],
    previousMonthAmount: 0,
  });
  const daily = require('./daily');
  const sender = require('../vk');
  sender.getUserInfo.mockResolvedValueOnce({ first_name: 'Арсений' });
  await daily();
  expect(sender.sendMessage.mock.calls[1][0]).toMatch(/Самый активный участник/);
  expect(sender.sendMessage.mock.calls[1][0]).toMatch(/Арсений/);
  expect(sender.getUserInfo).toHaveBeenCalledTimes(1);
  expect(sender.getUserInfo).toHaveBeenCalledWith(2222);
});

test('Bot correctly shows most active users (case with two users)', async () => {
  mockAds('');
  mockHolidays([]);
  mockDate(new Date(2020, 0, 1));
  mockStatistics({
    totalAmount: 200,
    audioMessagesAmount: 10,
    stickersAmount: 20,
    repostsAmount: 5,
    mostActiveUsers: [ 2222, 3333 ],
    previousMonthAmount: 0,
  });
  const daily = require('./daily');
  const sender = require('../vk');
  sender.getUserInfo
    .mockResolvedValueOnce({ first_name: 'Арсений' })
    .mockResolvedValueOnce({ first_name: 'Борис' });
  await daily();
  expect(sender.sendMessage.mock.calls[1][0]).toMatch(/Самые активные участники/);
  expect(sender.sendMessage.mock.calls[1][0]).toMatch(/Арсений/);
  expect(sender.sendMessage.mock.calls[1][0]).toMatch(/Борис/);
  expect(sender.getUserInfo).toHaveBeenCalledTimes(2);
  expect(sender.getUserInfo).toHaveBeenCalledWith(2222);
  expect(sender.getUserInfo).toHaveBeenCalledWith(3333);
});

test('Bot does not show most active users if there were no messages in previous month', async () => {
  mockAds('');
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
  const sender = require('../vk');
  await daily();
  expect(sender.sendMessage.mock.calls[1][0]).not.toMatch(/Самые активные участники/);
  expect(sender.sendMessage.mock.calls[1][0]).not.toMatch(/Самый активный участник/);
  expect(sender.getUserInfo).not.toHaveBeenCalled();
});

test('If it is not first day of month, statistics are not shown for previous month', async () => {
  mockAds('');
  mockHolidays([]);
  mockDate(new Date(2020, 0, 10));
  const daily = require('./daily');
  const sender = require('../vk');
  await daily();
  expect(sender.sendMessage.mock.calls[1]).toBeUndefined();
});

test('If it is not first day of month, statistics are not reset', async () => {
  mockAds('');
  mockHolidays([]);
  mockDate(new Date(2020, 0, 10));
  const daily = require('./daily');
  const statistics = require('../statistics/statistics');
  await daily();
  expect(statistics.resetStatistics).not.toHaveBeenCalled();
});
