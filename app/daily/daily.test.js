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

test('If holidays are present and ads is present, then 3 messages are sent to chat in correct order - weather, holidays, ads', async () => {
  mockAds('Ads message');
  mockHolidays(['Holiday 1']);
  const daily = require('./daily');
  const sender = require('../vk');
  await daily();
  expect(sender.sendMessage).toHaveBeenCalledTimes(3);
  expect(sender.sendMessage.mock.calls[0][0]).toMatch(/Прогноз погоды/);
  expect(sender.sendMessage.mock.calls[1][0]).toMatch(/Holiday 1/);
  expect(sender.sendMessage.mock.calls[2][0]).toBe('Ads message');
});

test('If holidays are present and ads is not present, then 2 messages are sent to chat in correct order - weather, holidays', async () => {
  mockAds('');
  mockHolidays(['Holiday 1']);
  const daily = require('./daily');
  const sender = require('../vk');
  await daily();
  expect(sender.sendMessage).toHaveBeenCalledTimes(2);
  expect(sender.sendMessage.mock.calls[0][0]).toMatch(/Прогноз погоды/);
  expect(sender.sendMessage.mock.calls[1][0]).toMatch(/Holiday 1/);
});

test('If holidays are not present and ads is present, then 2 messages are sent to chat in correct order - weather, ads', async () => {
  mockAds('Ads other message');
  mockHolidays([]);
  const daily = require('./daily');
  const sender = require('../vk');
  await daily();
  expect(sender.sendMessage).toHaveBeenCalledTimes(2);
  expect(sender.sendMessage.mock.calls[0][0]).toMatch(/Прогноз погоды/);
  expect(sender.sendMessage.mock.calls[1][0]).toBe('Ads other message');
});

test('If holidays are not present and ads is not present, then only a weather message is sent', async () => {
  mockAds('');
  mockHolidays([]);
  const daily = require('./daily');
  const sender = require('../vk');
  await daily();
  expect(sender.sendMessage).toHaveBeenCalledTimes(1);
  expect(sender.sendMessage.mock.calls[0][0]).toMatch(/Прогноз погоды/);
});

test('Holiday message is correct if 1 holiday is celebrated today', async () => {
  mockAds('');
  mockHolidays(['Holiday 1']);
  const daily = require('./daily');
  const sender = require('../vk');
  await daily();
  expect(sender.sendMessage.mock.calls[1][0]).toMatch(/сегодня Holiday 1\?/);
});

test('Holiday message is correct if 2 holidays are celebrated today', async () => {
  mockAds('');
  mockHolidays(['Holiday 1', 'Holiday 2']);
  const daily = require('./daily');
  const sender = require('../vk');
  await daily();
  expect(sender.sendMessage.mock.calls[1][0]).toMatch(/сегодня Holiday 1 и Holiday 2\?/);
});

test('Holiday message is correct if 3 holidays are celebrated today', async () => {
  mockAds('');
  mockHolidays(['Holiday 1', 'Holiday 2', 'Holiday 3']);
  const daily = require('./daily');
  const sender = require('../vk');
  await daily();
  expect(sender.sendMessage.mock.calls[1][0]).toMatch(/сегодня Holiday 1, Holiday 2 и Holiday 3\?/);
});

test('Holiday message is correct if 4 holidays are celebrated today', async () => {
  mockAds('');
  mockHolidays(['Holiday 1', 'Holiday 2', 'Holiday 3', 'Holiday 4']);
  const daily = require('./daily');
  const sender = require('../vk');
  await daily();
  expect(sender.sendMessage.mock.calls[1][0]).toMatch(/сегодня Holiday 1, Holiday 2, Holiday 3 и Holiday 4\?/);
});
