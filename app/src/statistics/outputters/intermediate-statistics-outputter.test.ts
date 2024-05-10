import * as statisticsObjects from '../test-resources/statistics-objects';
import {intermediateStatisticsOutputter} from './intermediate-statistics-outputter';
import vk from '../../vk/vk';
import {Month} from '../../util';

jest.useFakeTimers();

const sendMessageSpy = jest.spyOn(vk, 'sendMessage').mockResolvedValue(true);

describe('Intermediate statistics outputter', () => {

  beforeAll(() => {
    jest.setSystemTime(new Date(2020, Month.JANUARY, 11));
  });

  test('Bot correctly displays statistics for current month', async () => {
    await intermediateStatisticsOutputter.output(statisticsObjects.commonExample);
    const message = sendMessageSpy.mock.calls[0][0];
    expect(message.text).toMatch('Промежуточная статистика беседы за январь');
    expect(message.text).toMatch('100 сообщений');
  });

  test('Bot correctly shows most active users (case with one user)', async () => {
    await intermediateStatisticsOutputter.output(statisticsObjects.oneMostActiveUser);
    const message = sendMessageSpy.mock.calls[0][0];
    expect(message.text).toMatch('Самый активный участник');
    expect(message.text).toMatch('Арсений');
  });

  test('Bot correctly shows most active users (case with two users)', async () => {
    await intermediateStatisticsOutputter.output(statisticsObjects.twoMostActiveUsers);
    const message = sendMessageSpy.mock.calls[0][0];
    expect(message.text).toMatch('Самые активные участники');
    expect(message.text).toMatch('Арсений');
    expect(message.text).toMatch('Борис');
  });

  test('Bot does not show most active users if there were no messages in previous month', async () => {
    await intermediateStatisticsOutputter.output(statisticsObjects.zeroMessagesInTotal);
    const message = sendMessageSpy.mock.calls[0][0];
    expect(message.text).not.toMatch('Самые активные участники');
    expect(message.text).not.toMatch('Самый активный участник');
  });

});
