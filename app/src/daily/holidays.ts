import cheerio from 'cheerio';
import needle from 'needle';
import {Month} from '../util';

const HOLIDAY_CATEGORIES = [
  'Праздники России',
  'Международные праздники',
  'Праздники ООН',
];

async function getHolidays(): Promise<string[] | null> {

  try {
    const today = new Date(Date.now());
    const url = `https://www.calend.ru/day/${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}/`;
    console.log(url);
    const response = await needle('get', url);
    const body = response.body;

    const $ = cheerio.load(body);

    const allHolidayElements = $('.block.holidays .itemsNet').children('li');
    const suitableHolidayElements = allHolidayElements.filter(function () {
      const html = $(this).html();
      if (!html) {
        return false;
      }
      return HOLIDAY_CATEGORIES.some(category => html.includes(category));
    });

    // Берём названия праздников из заголовков
    let holidays = suitableHolidayElements.map(function () {
      return $(this).find('.title a').text().trim();
    }).get();

    if (today.getMonth() === Month.DECEMBER && today.getDate() === 31 ||
      today.getMonth() === Month.JANUARY && today.getDate() === 1) {
      holidays = holidays.filter(holiday => !/[н|Н]овы[й|м]/.test(holiday));
      holidays = ['Новый год', ...holidays];
    }

    return holidays;
  } catch (error) {
    console.log('Error: ' + JSON.stringify(error));
    return null;
  }
}

export default {
  getHolidays,
};
