import {HolidayCategory} from './model/HolidayCategory';
import {holidaysOutputter} from './holidays-outputter';
import vk from '../../vk/vk';
import db from '../../db';
import {QueryResult} from 'pg';

const sendMessageSpy = jest.spyOn(vk, 'sendMessage').mockResolvedValue(true);

function mockDatabaseCalls(value: string): void {
  jest.spyOn(db, 'query').mockResolvedValue({
    rows: [{ value }]
  } as QueryResult);
}

describe('Holidays outputter', () => {

  test('If holidays are available and present, bot sends holidays list to chat', async () => {
    const holidaysMap: Map<HolidayCategory, string[]> = new Map();
    holidaysMap.set(HolidayCategory.RUSSIAN, ['Новый год']);
    await holidaysOutputter.output(holidaysMap);
    expect(sendMessageSpy).toHaveBeenCalled();
    expect(sendMessageSpy.mock.calls[0][0].keyboard?.buttons[0][0].action.label).toBe('Подробнее');
    expect(sendMessageSpy.mock.calls[0][0].text).toMatch('Праздники России');
    expect(sendMessageSpy.mock.calls[0][0].text).toMatch('Новый год');
  });

  test('If holidays are available and not present, bot sends no holidays message to chat', async () => {
    const noHolidaysMessage = 'Сегодня праздников нет';
    mockDatabaseCalls(noHolidaysMessage);
    await holidaysOutputter.output(new Map());
    expect(sendMessageSpy.mock.calls[0][0].text).toMatch(noHolidaysMessage);
  });

  test('If holidays are not available, bot sends failure message to chat', async () => {
    await holidaysOutputter.output(null);
    expect(sendMessageSpy.mock.calls[0][0].text).toMatch('Я не смог узнать, какие сегодня праздники');
  });
});
