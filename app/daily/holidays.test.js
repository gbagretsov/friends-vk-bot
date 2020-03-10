const axios = require('axios');
const { getHolidays } = require('./holidays');

let axiosGetMock;

afterEach(() => {
  axiosGetMock.mockRestore();
});

async function createMockForUrl(url) {
  const mockResponse = await axios.get(url);
  axiosGetMock = jest.spyOn(axios, 'get');
  axiosGetMock.mockImplementation(() => mockResponse);
}

test('Only New year is celebrated on 1st January 2020', async () => {
  await createMockForUrl('https://www.calend.ru/day/2020-1-1/');
  const holidays = await getHolidays();
  expect(holidays).toHaveLength(1);
  expect(holidays).toContain('Новый год');
});

test('Two Russian, international and UN holidays are celebrated on 4th January 2020', async () => {
  await createMockForUrl('https://www.calend.ru/day/2020-1-4/');
  const holidays = await getHolidays();
  expect(holidays).toHaveLength(2);
});

test('No Russian, international or UN holidays are celebrated on 30th January 2020', async () => {
  await createMockForUrl('https://www.calend.ru/day/2020-1-30/');
  const holidays = await getHolidays();
  expect(holidays).toHaveLength(0);
});

test('Only Defender of the Fatherland Day is celebrated on 23rd February 2020', async () => {
  await createMockForUrl('https://www.calend.ru/day/2020-2-23/');
  const holidays = await getHolidays();
  expect(holidays).toHaveLength(1);
  expect(holidays).toContain('День защитника Отечества в России');
});

test('Nine Russian, international and UN holidays are celebrated on 1st March 2020', async () => {
  await createMockForUrl('https://www.calend.ru/day/2020-3-1/');
  const holidays = await getHolidays();
  expect(holidays).toHaveLength(9);
});
