import {Outputter} from '../../model/Outputter';
import vk from '../../vk/vk';
import {holidayCategories, HolidayCategory, holidayCategoryIcons} from './model/HolidayCategory';
import util from 'util';
import db from '../../db';
import {VkKeyboard} from '../../vk/model/VkKeyboard';

const DETAILS_BUTTON_KEYBOARD: VkKeyboard = {
  inline: true,
  buttons: [[{
    action: {
      type: 'open_link',
      link: 'https://calend.ru',
      label: 'Подробнее',
    }
  }]]
};

export const holidaysOutputter: Outputter<Map<HolidayCategory, string[]> | null> = {
  output: async todayHolidays => {

    if (!todayHolidays) {
      console.log(`Holidays not available - message sent response: ${
        await vk.sendMessage('Я не смог узнать, какие сегодня праздники 😞 Мой источник calend.ru был недоступен')
      }`);
    } else if (todayHolidays.size > 0) {
      console.log(`Holidays: ${ util.inspect(todayHolidays) }`);
      const holidaysIntroductionMessages = [
        '🎉 A вы знали, что сегодня отмечаются эти праздники?',
        '🎉 Сегодня отмечаются:',
        '🎉 Готов поспорить, вы не могли дождаться, когда наступят эти праздники:',
        '🎉 Напишите мне в ответ, как вы будете отмечать эти праздники:',
      ];
      let holidaysMessage = holidaysIntroductionMessages[Math.floor(Math.random() * holidaysIntroductionMessages.length)];
      for (let categoryIndex = 0; categoryIndex < holidayCategories.length; categoryIndex++) {
        const holidaysForCategory = todayHolidays.get(holidayCategories[categoryIndex]);
        if (!holidaysForCategory) {
          continue;
        }
        const categoryIcon = holidayCategoryIcons[categoryIndex];
        let categoryMessage = `${categoryIcon} ${holidayCategories[categoryIndex]}`;
        holidaysForCategory.forEach(holiday =>  {
          categoryMessage += `\n- ${holiday}`;
        });
        holidaysMessage += `\n\n${categoryMessage}`;
      }
      await vk.sendKeyboard(DETAILS_BUTTON_KEYBOARD, holidaysMessage);
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
