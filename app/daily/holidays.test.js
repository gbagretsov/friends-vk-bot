const needle = require('needle');

afterEach(() => {
  jest.clearAllMocks();
  jest.resetModules();
});

async function createMocksForDate(year, month, day) {
  const mockedDate = new Date(year, month - 1, day, 2);
  const mockHolidaysResponse = await needle('get', `https://www.calend.ru/day/${year}-${month}-${day}/`);
  Date.now = jest.spyOn(Date, 'now').mockImplementation(() => mockedDate.getTime());
  jest.doMock('needle', () => () => Promise.resolve(mockHolidaysResponse));
}

test('Only New year is celebrated on 1st January 2020', async () => {
  await createMocksForDate(2020, 1, 1);
  const { getHolidays } = require('./holidays');
  const holidays = await getHolidays();
  expect(holidays).toHaveLength(1);
  expect(holidays).toContain('Новый год');
});

test('Two Russian, international and UN holidays are celebrated on 4th January 2020', async () => {
  await createMocksForDate(2020, 1, 4);
  const { getHolidays } = require('./holidays');
  const holidays = await getHolidays();
  expect(holidays).toHaveLength(2);
});

test('No Russian, international or UN holidays are celebrated on 30th January 2020', async () => {
  await createMocksForDate(2020, 1, 30);
  const { getHolidays } = require('./holidays');
  const holidays = await getHolidays();
  expect(holidays).toHaveLength(0);
});

test('Only Defender of the Fatherland Day is celebrated on 23rd February 2020', async () => {
  await createMocksForDate(2020, 2, 23);
  const { getHolidays } = require('./holidays');
  const holidays = await getHolidays();
  expect(holidays).toHaveLength(1);
  expect(holidays).toContain('День защитника Отечества в России');
});

test('Ten Russian, international and UN holidays are celebrated on 1st March 2020', async () => {
  await createMocksForDate(2020, 3, 1);
  const { getHolidays } = require('./holidays');
  const holidays = await getHolidays();
  expect(holidays).toHaveLength(10);
});

test('New year holiday is present in the list for 31st December 2020', async () => {
  await createMocksForDate(2020, 12, 31);
  const { getHolidays } = require('./holidays');
  const holidays = await getHolidays();
  expect(holidays).toContain('Новый год');
});
