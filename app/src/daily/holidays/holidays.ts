import cheerio from 'cheerio';
import needle from 'needle';
import {HolidayCategory, holidayCategoryLinks} from './model/HolidayCategory';
import {getPluralForm, Month} from '../../util';

const BOT_BIRTHDAY = new Date(2018, Month.SEPTEMBER, 27)

async function getHolidays(): Promise<Map<HolidayCategory, string[]> | null> {

  try {
    const today = new Date(Date.now());
    const url = `https://www.calend.ru/day/${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}/`;
    console.log(url);
    const response = await needle('get', url);
    const body = response.body;

    const isNewYearHandling = today.getMonth() === Month.DECEMBER && today.getDate() === 31 ||
      today.getMonth() === Month.JANUARY && today.getDate() === 1;
    const isBotBirthday = today.getMonth() === BOT_BIRTHDAY.getMonth()
        && today.getDate() === BOT_BIRTHDAY.getDate()

    const $ = cheerio.load(body);

    const allHolidayElements = [
      ...$('.block.holidays .itemsNet').children('li').get(),
      ...$('.block.thisDay .itemsNet').children('li').get(),
    ];
    const links = Object.keys(holidayCategoryLinks);
    const suitableHolidayElements = allHolidayElements.filter(element => {
      const html = $(element).html();
      if (!html) {
        return false;
      }
      return links.some(link => html.includes(link));
    });

    const holidaysByCategory: Map<HolidayCategory, string[]> = new Map();

    const addHolidayToCategory = (holiday: string, category: HolidayCategory) => {
      if (holidaysByCategory.has(category)) {
        holidaysByCategory.get(category)!.push(holiday);
      } else {
        holidaysByCategory.set(category, [holiday]);
      }
    }

    if (isNewYearHandling) {
      addHolidayToCategory('Новый год', HolidayCategory.WORLD);
    }

    suitableHolidayElements.forEach(element => {
      const categoryLink = $(element).find('.link a').attr('href')?.trim();
      if (!categoryLink) {
        return;
      }
      const category: HolidayCategory = holidayCategoryLinks[categoryLink];
      const holiday = $(element).find('.title a').text().trim();
      if (isNewYearHandling && /[н|Н]овы[й|м]/.test(holiday)) {
        return;
      }

      addHolidayToCategory(holiday, category);
    });

    if (isBotBirthday) {
      const botAge = today.getFullYear() - BOT_BIRTHDAY.getFullYear();
      const botAgeSuffix = getPluralForm(botAge, 'год', 'года', 'лет');
      addHolidayToCategory(`Мой день рождения ☺ (сегодня мне исполняется ${botAge} ${botAgeSuffix})`, HolidayCategory.RUSSIAN);
    }

    return holidaysByCategory;
  } catch (error) {
    console.log('Error: ' + JSON.stringify(error));
    return null;
  }
}

export default {
  getHolidays,
};
