import {holidays20200130} from './test-resources/holidays-pages/2020-1-30';
import {holidays20200301} from './test-resources/holidays-pages/2020-3-1';
import {holidays20201231} from './test-resources/holidays-pages/2020-12-31';

jest.doMock('needle', () => {
  const urlResult: Map<string, string> = new Map<string, string>();
  urlResult.set('https://www.calend.ru/day/2020-1-30/', holidays20200130);
  urlResult.set('https://www.calend.ru/day/2020-3-1/', holidays20200301);
  urlResult.set('https://www.calend.ru/day/2020-12-31/', holidays20201231);
  return (action: string, url: string) => Promise.resolve({
    body: urlResult.get(url)
  });
});

import holidaysModule from './holidays';
import {Month} from '../../util';
import {HolidayCategory} from './model/HolidayCategory';
import {Holiday} from './model/Holiday';

jest.useFakeTimers('modern');

async function createMocksForDate(year: number, month: number, day: number): Promise<void> {
  jest.setSystemTime(new Date(year, month, day, 10));
}

describe('Holidays', () => {
    
  test('No supported holidays celebrated on 30th January 2020', async () => {
    await createMocksForDate(2020, Month.JANUARY, 30);
    const holidays = await holidaysModule.getHolidays() as Map<HolidayCategory, Holiday[]>;
    expect(holidays.size).toBe(0);
  });
  
  test('Eleven supported holidays are celebrated on 1st March 2020', async () => {
    await createMocksForDate(2020, Month.MARCH, 1);
    const holidays = await holidaysModule.getHolidays() as Map<HolidayCategory, Holiday[]>;
    expect(holidays.size).toBe(4);
    expect(holidays.get('Праздники России')!.map(holiday => holiday.name)).toEqual([
      'День Забайкальского края',
      'День экспертно-криминалистической службы системы МВД России',
      'День хостинг-провайдера в России',
      'День джигита',
      'День кошек в России',
    ]);
    expect(holidays.get('Международные праздники')!.map(holiday => holiday.name)).toEqual([
      'Всемирный день комплимента',
      'Международный день детского телевидения и радиовещания',
      'Всемирный день гражданской обороны',
      'Праздник прихода весны',
    ]);
    expect(holidays.get('Праздники ООН')!.map(holiday => holiday.name)).toEqual([
      'День «Ноль дискриминации»',
    ]);
    expect(holidays.get('Православные праздники')!.map(holiday => holiday.name)).toEqual([
      'Прощеное воскресенье',
    ]);
  });
});
