import {Outputter} from '../../model/Outputter';
import vk from '../../vk/vk';
import {holidayCategories, HolidayCategory, holidayCategoryIcons} from './model/HolidayCategory';
import {Holiday} from './model/Holiday';
import util from 'util';
import db from '../../db';
import {VkKeyboard} from '../../vk/model/VkKeyboard';
import {truncate} from '../../util';

const MAX_HOLIDAYS_PER_CATEGORY = 6;

function getHolidaysKeyboard(holidays: Holiday[]): VkKeyboard {
  return {
    inline: true,
    buttons: holidays.map(holiday => ([{
      action: {
        type: 'open_link',
        link: holiday.link,
        label: truncate(holiday.name, 40),
      }
    }])),
  };
}

export const holidaysOutputter: Outputter<Map<HolidayCategory, Holiday[]> | null> = {
  output: async todayHolidays => {

    if (!todayHolidays) {
      console.log(`Holidays not available - message sent response: ${
        await vk.sendMessage('Я не смог узнать, какие сегодня праздники 😞 Мой источник calend.ru был недоступен')
      }`);
    } else if (todayHolidays.size > 0) {
      console.log(`Holidays: ${ util.inspect(todayHolidays) }`);
      const holidaysMessages = [
        '🎉 A вы знали, что сегодня отмечаются эти праздники?',
        '🎉 Сегодня отмечаются:',
        '🎉 Готов поспорить, вы не могли дождаться, когда наступят эти праздники:',
        '🎉 Напишите мне в ответ, как вы будете отмечать эти праздники:',
      ];
      await vk.sendMessage(holidaysMessages[Math.floor(Math.random() * holidaysMessages.length)]);
      for (let categoryIndex = 0; categoryIndex < holidayCategories.length; categoryIndex++) {
        const holidaysForCategory = todayHolidays.get(holidayCategories[categoryIndex]);
        if (!holidaysForCategory) {
          continue;
        }
        const categoryIcon = holidayCategoryIcons[categoryIndex];
        const categoryMessage = `${categoryIcon} ${holidayCategories[categoryIndex]}`;
        for (let holidayIndex = 0; holidayIndex < holidaysForCategory.length; holidayIndex += MAX_HOLIDAYS_PER_CATEGORY) {
          const holidaysKeyboard = getHolidaysKeyboard(holidaysForCategory.slice(holidayIndex, holidayIndex + MAX_HOLIDAYS_PER_CATEGORY));
          await vk.sendKeyboard(holidaysKeyboard, holidayIndex === 0 ? categoryMessage : `${categoryMessage} (продолжение)`);
        }
      }
    } else {
      const response = await db.query<{key: string, value: string}>
      ('SELECT value FROM friends_vk_bot.state WHERE key = \'absent_holidays_phrases\';');
      const absentHolidaysPhrases = response.rows[0].value.split('\n');
      console.log(`Holidays list is empty - message sent response: ${
        await vk.sendMessage(absentHolidaysPhrases[Math.floor(Math.random() * absentHolidaysPhrases.length)])
      }`);
    }
  }
};
