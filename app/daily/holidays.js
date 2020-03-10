const cheerio = require('cheerio');
const axios = require('axios');

module.exports.getHolidays = async function() {

  const response = await axios.get('https://www.calend.ru');
  const body = response.data;

  const $ = cheerio.load(body);

  const allHolidayElements = $('.block.holidays .itemsNet').children('li');
  const suitableHolidayElements = allHolidayElements.filter(function () {
    let html = $(this).html();
    // Оставляем российские праздники, международные праздники и праздники ООН
    return html.includes('/1.gif') || html.includes('/15.gif') || html.includes('/79.gif');
  });

  // Берём названия праздников из заголовков
  return suitableHolidayElements.map(function () {
    return $(this).find('.title a').text().trim();
  }).get();

};
