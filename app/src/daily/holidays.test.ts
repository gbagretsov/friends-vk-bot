import holidaysModule from './holidays';

jest.useFakeTimers('modern');

async function createMocksForDate(year: number, month: number, day: number): Promise<void> {
  jest.setSystemTime(new Date(year, month - 1, day, 10));
}

test('Only New year is celebrated on 1st January 2020', async () => {
  await createMocksForDate(2020, 1, 1);
  const holidays = await holidaysModule.getHolidays();
  expect(holidays).toHaveLength(1);
  expect(holidays).toContain('Новый год');
});

test('Two Russian, international and UN holidays are celebrated on 4th January 2020', async () => {
  await createMocksForDate(2020, 1, 4);
  const holidays = await holidaysModule.getHolidays();
  expect(holidays).toHaveLength(2);
});

test('No Russian, international or UN holidays are celebrated on 30th January 2020', async () => {
  await createMocksForDate(2020, 1, 30);
  const holidays = await holidaysModule.getHolidays();
  expect(holidays).toHaveLength(0);
});

test('Only Defender of the Fatherland Day is celebrated on 23rd February 2020', async () => {
  await createMocksForDate(2020, 2, 23);
  const holidays = await holidaysModule.getHolidays();
  expect(holidays).toHaveLength(1);
  expect(holidays).toContain('День защитника Отечества в России');
});

test('Ten Russian, international and UN holidays are celebrated on 1st March 2020', async () => {
  await createMocksForDate(2020, 3, 1);
  const holidays = await holidaysModule.getHolidays();
  expect(holidays).toHaveLength(10);
});

test('New year holiday is present in the list for 31st December 2020', async () => {
  await createMocksForDate(2020, 12, 31);
  const holidays = await holidaysModule.getHolidays();
  expect(holidays).toContain('Новый год');
});
