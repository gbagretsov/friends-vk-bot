import holidaysModule from './holidays';
import {holidays20200130} from './test-resources/holidays-pages/2020-1-30';
import {holidays20200301} from './test-resources/holidays-pages/2020-3-1';
import {holidays20201231} from './test-resources/holidays-pages/2020-12-31';

jest.useFakeTimers('modern');

async function createMocksForDate(year: number, month: number, day: number): Promise<void> {
  jest.setSystemTime(new Date(year, month - 1, day, 10));
}

describe('Holidays', () => {
  beforeAll(() => {
    jest.mock('needle', () => {
      const urlResult: Map<string, string> = new Map<string, string>();
      urlResult.set('https://www.calend.ru/day/2020-1-30/', holidays20200130);
      urlResult.set('https://www.calend.ru/day/2020-3-1/', holidays20200301);
      urlResult.set('https://www.calend.ru/day/2020-12-31/', holidays20201231);
      return (action: string, url: string) => Promise.resolve({
        body: urlResult.get(url)
      });
    });
  });
    
  test('No Russian, international or UN holidays are celebrated on 30th January 2020', async () => {
    await createMocksForDate(2020, 1, 30);
    const holidays = await holidaysModule.getHolidays();
    expect(holidays).toHaveLength(0);
  });
  
  test('Ten Russian, international and UN holidays are celebrated on 1st March 2020', async () => {
    await createMocksForDate(2020, 3, 1);
    const holidays = await holidaysModule.getHolidays();
    expect(holidays).toEqual([
      'Всемирный день комплимента',
      'Международный день детского телевидения и радиовещания',
      'Всемирный день гражданской обороны',
      'День «Ноль дискриминации»',
      'День Забайкальского края',
      'День экспертно-криминалистической службы системы МВД России',
      'День хостинг-провайдера в России',
      'День джигита',
      'День кошек в России',
      'Праздник прихода весны',
    ]);
  });
  
  test('New year holiday is present in the list for 31st December 2020', async () => {
    await createMocksForDate(2020, 12, 31);
    const holidays = await holidaysModule.getHolidays();
    expect(holidays).toContain('Новый год');
  });
});
