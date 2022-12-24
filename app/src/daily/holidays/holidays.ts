import cheerio from 'cheerio';
import needle from 'needle';
import {HolidayCategory, holidayCategories} from './model/HolidayCategory';
import {Month} from '../../util';

async function getHolidays(): Promise<Map<HolidayCategory, string[]> | null> {

  try {
    const today = new Date(Date.now());
    const url = `https://www.calend.ru/day/${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}/`;
    console.log(url);
    const response = await needle('get', url);
    const body = response.body;

    const isNewYearHandling = today.getMonth() === Month.DECEMBER && today.getDate() === 31 ||
      today.getMonth() === Month.JANUARY && today.getDate() === 1;

    const $ = cheerio.load(body);

    const allHolidayElements = [
      ...$('.block.holidays .itemsNet').children('li').get(),
      ...$('.block.thisDay .itemsNet').children('li').get(),
    ];
    const suitableHolidayElements = allHolidayElements.filter(element => {
      const html = $(element).html();
      if (!html) {
        return false;
      }
      return holidayCategories.some(category => html.includes(category));
    });

    const holidaysByCategory: Map<HolidayCategory, string[]> = new Map();
    if (isNewYearHandling) {
      holidaysByCategory.set('Международные праздники', ['Новый год']);
    }

    suitableHolidayElements.forEach(element => {
      const category: HolidayCategory = $(element).find('.link a').text().trim() as HolidayCategory;
      const holiday = $(element).find('.title a').text().trim();
      if (isNewYearHandling && /[н|Н]овы[й|м]/.test(holiday)) {
        return;
      }
      if (holidaysByCategory.has(category)) {
        holidaysByCategory.get(category)!.push(holiday);
      } else {
        holidaysByCategory.set(category, [holiday]);
      }
    });

    return holidaysByCategory;
  } catch (error) {
    console.log('Error: ' + JSON.stringify(error));
    return null;
  }
}

export default {
  getHolidays,
};
