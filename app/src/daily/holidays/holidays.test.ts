import {holidays_2020_01_30} from './test-resources/holidays-pages/2020-1-30';
import {holidays_2020_03_01} from './test-resources/holidays-pages/2020-3-1';
import {holidays_2020_12_31} from './test-resources/holidays-pages/2020-12-31';
import {holidays_2021_01_01} from './test-resources/holidays-pages/2021-01-01';

jest.doMock('needle', () => {
  const urlResult: Map<string, string> = new Map<string, string>();
  urlResult.set('https://www.calend.ru/day/2020-1-30/', holidays_2020_01_30);
  urlResult.set('https://www.calend.ru/day/2020-3-1/', holidays_2020_03_01);
  urlResult.set('https://www.calend.ru/day/2020-12-31/', holidays_2020_12_31);
  urlResult.set('https://www.calend.ru/day/2021-1-1/', holidays_2021_01_01);
  return (action: string, url: string) => Promise.resolve({
    body: urlResult.get(url)
  });
});

import holidaysModule from './holidays';
import {Month} from '../../util';
import {HolidayCategory} from './model/HolidayCategory';

jest.useFakeTimers();

async function createMocksForDate(year: number, month: number, day: number): Promise<void> {
  jest.setSystemTime(new Date(year, month, day, 10));
}

describe('Holidays', () => {
    
  test('No supported holidays celebrated on 30th January 2020', async () => {
    await createMocksForDate(2020, Month.JANUARY, 30);
    const holidays = await holidaysModule.getHolidays() as Map<HolidayCategory, string[]>;
    expect(holidays.size).toBe(0);
  });
  
  test('Eleven supported holidays are celebrated on 1st March 2020', async () => {
    await createMocksForDate(2020, Month.MARCH, 1);
    const holidays = await holidaysModule.getHolidays() as Map<HolidayCategory, string[]>;
    expect(holidays.size).toBe(4);
    expect(holidays.get(HolidayCategory.RUSSIAN)).toEqual([
      'День Забайкальского края',
      'День экспертно-криминалистической службы системы МВД России',
      'День хостинг-провайдера в России',
      'День джигита',
      'День кошек в России',
    ]);
    expect(holidays.get(HolidayCategory.WORLD)).toEqual([
      'Всемирный день комплимента',
      'Международный день детского телевидения и радиовещания',
      'Всемирный день гражданской обороны',
      'Праздник прихода весны',
    ]);
    expect(holidays.get(HolidayCategory.UN)).toEqual([
      'День «Ноль дискриминации»',
    ]);
    expect(holidays.get(HolidayCategory.ORTHODOX)).toEqual([
      'Прощеное воскресенье',
    ]);
  });

  test('New Year is correctly handled on 31st December 2020', async () => {
    await createMocksForDate(2020, Month.DECEMBER, 31);
    const holidays = await holidaysModule.getHolidays() as Map<HolidayCategory, string[]>;
    expect(holidays.has(HolidayCategory.RUSSIAN)).toBe(false);
    expect(holidays.get(HolidayCategory.WORLD)![0]).toEqual('Новый год');
  });

  test('New Year is correctly handled on 1st January 2021', async () => {
    await createMocksForDate(2021, Month.JANUARY, 1);
    const holidays = await holidaysModule.getHolidays() as Map<HolidayCategory, string[]>;
    expect(holidays.has(HolidayCategory.RUSSIAN)).toBe(false);
    expect(holidays.get(HolidayCategory.WORLD)![0]).toEqual('Новый год');
  });
});
