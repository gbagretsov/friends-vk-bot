const sender = require('../vk');
const holidays = require('./holidays');

const holidaysMock = jest.spyOn(holidays, 'getHolidays');

jest.mock('../vk');
sender.sendSticker.mockResolvedValue('ok');
sender.sendMessage.mockResolvedValue('ok');

let ads;

let daily;

beforeAll(async () => {

  let weather = require('./weather');
  const weatherMockResponse = await weather.getCurrentWeather();
  const forecastMockResponse = await weather.getForecast();
  jest.doMock('./weather');
  weather = require('./weather');
  weather.getCurrentWeather.mockReturnValue(weatherMockResponse);
  weather.getForecast.mockReturnValue(forecastMockResponse);

  jest.doMock('../db', () => () => ({
    query: () => Promise.resolve({
      rows: [{ value: ads }],
    }),
    end: () => Promise.resolve(),
  }));

  jest.spyOn(global.Math, 'random').mockReturnValue(0.1);

  daily = require('./daily');

});

afterEach(() => {
  jest.clearAllMocks();
});

test('If holidays are present and ads is present, then 3 messages are sent to chat in correct order - weather, holidays, ads', async () => {
  holidaysMock.mockImplementation(() => ['Holiday 1']);
  ads = 'Ads message';
  await daily();
  expect(sender.sendMessage).toHaveBeenCalledTimes(3);
  expect(sender.sendMessage.mock.calls[0][0]).toMatch(/Прогноз погоды/);
  expect(sender.sendMessage.mock.calls[1][0]).toMatch(/Holiday 1/);
  expect(sender.sendMessage.mock.calls[2][0]).toBe('Ads message');
});

test('If holidays are present and ads is not present, then 2 messages are sent to chat in correct order - weather, holidays', async () => {
  holidaysMock.mockImplementation(() => ['Holiday 1']);
  ads = '';
  await daily();
  expect(sender.sendMessage).toHaveBeenCalledTimes(2);
  expect(sender.sendMessage.mock.calls[0][0]).toMatch(/Прогноз погоды/);
  expect(sender.sendMessage.mock.calls[1][0]).toMatch(/Holiday 1/);
});

test('If holidays are not present and ads is present, then 2 messages are sent to chat in correct order - weather, ads', async () => {
  holidaysMock.mockImplementation(() => []);
  ads = 'Ads other message';
  await daily();
  expect(sender.sendMessage).toHaveBeenCalledTimes(2);
  expect(sender.sendMessage.mock.calls[0][0]).toMatch(/Прогноз погоды/);
  expect(sender.sendMessage.mock.calls[1][0]).toBe('Ads other message');
});

test('If holidays are not present and ads is not present, then only a weather message is sent', async () => {
  holidaysMock.mockImplementation(() => []);
  ads = '';
  await daily();
  expect(sender.sendMessage).toHaveBeenCalledTimes(1);
  expect(sender.sendMessage.mock.calls[0][0]).toMatch(/Прогноз погоды/);
});

test('Holiday message is correct if 1 holiday is celebrated today', async () => {
  holidaysMock.mockImplementation(() => ['Holiday 1']);
  await daily();
  expect(sender.sendMessage.mock.calls[1][0]).toMatch(/сегодня Holiday 1\?/);
});

test('Holiday message is correct if 2 holidays are celebrated today', async () => {
  holidaysMock.mockImplementation(() => ['Holiday 1', 'Holiday 2']);
  await daily();
  expect(sender.sendMessage.mock.calls[1][0]).toMatch(/сегодня Holiday 1 и Holiday 2\?/);
});

test('Holiday message is correct if 3 holidays are celebrated today', async () => {
  holidaysMock.mockImplementation(() => ['Holiday 1', 'Holiday 2', 'Holiday 3']);
  await daily();
  expect(sender.sendMessage.mock.calls[1][0]).toMatch(/сегодня Holiday 1, Holiday 2 и Holiday 3\?/);
});

test('Holiday message is correct if 4 holidays are celebrated today', async () => {
  holidaysMock.mockImplementation(() => ['Holiday 1', 'Holiday 2', 'Holiday 3', 'Holiday 4']);
  await daily();
  expect(sender.sendMessage.mock.calls[1][0]).toMatch(/сегодня Holiday 1, Holiday 2, Holiday 3 и Holiday 4\?/);
});

