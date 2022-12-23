import {HolidayCategory} from './model/HolidayCategory';
import {Holiday} from './model/Holiday';
import {holidaysOutputter} from './holidays-outputter';
import vk from '../../vk/vk';
import db from '../../db';
import {QueryResult} from 'pg';

const sendKeyboardSpy = jest.spyOn(vk, 'sendKeyboard').mockResolvedValue(true);
const sendMessageSpy = jest.spyOn(vk, 'sendMessage').mockResolvedValue(true);

function mockDatabaseCalls(value: string): void {
  jest.spyOn(db, 'query').mockResolvedValue({
    rows: [{ value }]
  } as QueryResult);
}

describe('Holidays outputter', () => {

  test('If holidays are available and present, bot sends holidays list to chat', async () => {
    const holidaysMap: Map<HolidayCategory, Holiday[]> = new Map();
    holidaysMap.set('Праздники России', [{ name: 'Новый год', link: '' }]);
    await holidaysOutputter.output(holidaysMap);
    expect(sendKeyboardSpy).toHaveBeenCalled();
    expect(sendKeyboardSpy.mock.calls[0][0].buttons[0][0].action.label).toBe('Новый год');
  });

  test('If holidays are available and not present, bot sends no holidays message to chat', async () => {
    const noHolidaysMessage = 'Сегодня праздников нет';
    mockDatabaseCalls(noHolidaysMessage);
    await holidaysOutputter.output(new Map());
    expect(sendMessageSpy.mock.calls[0][0]).toMatch(noHolidaysMessage);
  });

  test('If holidays are not available, bot sends failure message to chat', async () => {
    await holidaysOutputter.output(null);
    expect(sendMessageSpy.mock.calls[0][0]).toMatch('Я не смог узнать, какие сегодня праздники');
  });
});
