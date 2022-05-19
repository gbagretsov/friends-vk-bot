import cheerio from 'cheerio';
import needle from 'needle';
import {HolidayCategory, holidayCategories} from './model/HolidayCategory';
import {Holiday} from './model/Holiday';

async function getHolidays(): Promise<Map<HolidayCategory, Holiday[]> | null> {

  try {
    const today = new Date(Date.now());
    const url = `https://www.calend.ru/day/${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}/`;
    console.log(url);
    const response = await needle('get', url);
    const body = response.body;

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

    const holidaysByCategory: Map<HolidayCategory, Holiday[]> = new Map();

    suitableHolidayElements.forEach(element => {
      const category: HolidayCategory = $(element).find('.link a').text().trim() as HolidayCategory;
      const holiday: Holiday = {
        name: $(element).find('.title a').text().trim(),
        link: $(element).find('.title a').attr().href,
      };
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
