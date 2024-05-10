import * as statisticsObjects from '../test-resources/statistics-objects';
import {finalStatisticsOutputter} from './final-statistics-outputter';
import vk from '../../vk/vk';
import {Month} from '../../util';

jest.useFakeTimers();

const sendMessageSpy = jest.spyOn(vk, 'sendMessage').mockResolvedValue(true);
const addPhotoToAlbumSpy = jest.spyOn(vk, 'addPhotoToAlbum').mockResolvedValue();

process.env.VK_LEADERBOARD_ALBUM_ID = 'album_id';

describe('Final statistics outputter', () => {

  beforeAll(() => {
    jest.setSystemTime(new Date(2020, Month.JANUARY, 1));
  });

  test('Bot correctly displays statistics for previous month', async () => {
    await finalStatisticsOutputter.output(statisticsObjects.commonExample);
    const message = sendMessageSpy.mock.calls[0][0].text;
    expect(message).toMatch('Статистика беседы за декабрь');
    expect(message).toMatch('100 сообщений');
    expect(message).toMatch('10 голосовых сообщений');
    expect(message).toMatch('20 стикеров');
    expect(message).toMatch('5 мемов');
  });

  test('Bot correctly displays changes in comparison to month before previous one (case when equals)', async () => {
    await finalStatisticsOutputter.output(statisticsObjects.totalEqualToPrevMonth);
    const message = sendMessageSpy.mock.calls[0][0].text;
    expect(message).toMatch('не изменилось');
  });

  test('Bot correctly displays changes in comparison to month before previous one (case when increased insignificantly)', async () => {
    await finalStatisticsOutputter.output(statisticsObjects.totalIncreasedInsignificantly);
    const message = sendMessageSpy.mock.calls[0][0].text;
    expect(message).toMatch('незначительно увеличилось');
  });

  test('Bot correctly displays changes in comparison to month before previous one (case when decreased insignificantly)', async () => {
    await finalStatisticsOutputter.output(statisticsObjects.totalDecreasedInsignificantly);
    const message = sendMessageSpy.mock.calls[0][0].text;
    expect(message).toMatch('незначительно уменьшилось');
  });

  test('Bot correctly displays changes in comparison to month before previous one (case when increased significantly)', async () => {
    await finalStatisticsOutputter.output(statisticsObjects.totalIncreasedSignificantly);
    const message = sendMessageSpy.mock.calls[0][0].text;
    expect(message).toMatch('увеличилось на 10%');
  });

  test('Bot correctly displays changes in comparison to month before previous one (case when decreased significantly)', async () => {
    await finalStatisticsOutputter.output(statisticsObjects.totalDecreasedSignificantly);
    const message = sendMessageSpy.mock.calls[0][0].text;
    expect(message).toMatch('уменьшилось на 10%');
  });

  test('Bot correctly displays name of month before previous one', async () => {
    await finalStatisticsOutputter.output(statisticsObjects.totalEqualToPrevMonth);
    const message = sendMessageSpy.mock.calls[0][0].text;
    expect(message).toMatch('с ноябрём');
  });

  test('Bot correctly handles case when there is no statistics for month before previous one', async () => {
    await finalStatisticsOutputter.output(statisticsObjects.noDataForPrevPrevMonth);
    const message = sendMessageSpy.mock.calls[0][0].text;
    expect(message).not.toMatch('общее количество сообщений');
  });

  test('Bot correctly handles case when there were zero messages in month before previous one', async () => {
    await finalStatisticsOutputter.output(statisticsObjects.zeroMessagesInPrevPrevMonth);
    const message = sendMessageSpy.mock.calls[0][0].text;
    expect(message).toMatch('увеличилось на ∞%');
  });

  test('Bot correctly handles case when there were zero messages in previous month', async () => {
    await finalStatisticsOutputter.output(statisticsObjects.zeroMessagesInTotal);
    const message = sendMessageSpy.mock.calls[0][0].text;
    expect(message).toMatch('уменьшилось на 100%');
  });

  test('Bot correctly handles case when there were zero messages in month before previous one ' +
    'and zero messages in previous month', async () => {
    await finalStatisticsOutputter.output(statisticsObjects.zeroMessagesInTotalAndInPrevPrevMonth);
    const message = sendMessageSpy.mock.calls[0][0].text;
    expect(message).toMatch('не изменилось');
  });

  test('Bot correctly shows most active users (case with one user)', async () => {
    await finalStatisticsOutputter.output(statisticsObjects.oneMostActiveUser);
    const message = sendMessageSpy.mock.calls[0][0].text;
    expect(message).toMatch('Самый активный участник');
    expect(message).toMatch('Арсений');
    expect(sendMessageSpy).toHaveBeenCalledTimes(2);
    const photos = sendMessageSpy.mock.calls[1][0].photos;
    expect(photos?.[0]).toBeDefined();
    expect(addPhotoToAlbumSpy).toHaveBeenCalledTimes(1);
  });

  test('Bot correctly shows most active users (case with two users)', async () => {
    await finalStatisticsOutputter.output(statisticsObjects.twoMostActiveUsers);
    const message = sendMessageSpy.mock.calls[0][0].text;
    expect(message).toMatch('Самые активные участники');
    expect(message).toMatch('Арсений');
    expect(message).toMatch('Борис');
    expect(sendMessageSpy).toHaveBeenCalledTimes(3);
    const photos1 = sendMessageSpy.mock.calls[1][0].photos;
    expect(photos1?.[0]).toBeDefined();
    const photos2 = sendMessageSpy.mock.calls[2][0].photos;
    expect(photos2?.[0]).toBeDefined();
    expect(addPhotoToAlbumSpy).toHaveBeenCalledTimes(2);
  });

  test('Bot does not show most active users if there were no messages in previous month', async () => {
    await finalStatisticsOutputter.output(statisticsObjects.zeroMessagesInTotal);
    const message = sendMessageSpy.mock.calls[0][0].text;
    expect(message).not.toMatch('Самые активные участники');
    expect(message).not.toMatch('Самый активный участник');
    expect(sendMessageSpy).toHaveBeenCalledTimes(1);
    expect(addPhotoToAlbumSpy).not.toHaveBeenCalled();
  });

});
