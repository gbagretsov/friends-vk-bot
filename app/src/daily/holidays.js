const cheerio = require('cheerio');
const needle = require('needle');

module.exports.getHolidays = async function() {

  try {
    const today = new Date(Date.now());
    const url = `https://www.calend.ru/day/${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}/`;
    console.log(url);
    const response = await needle('get', url);
    const body = response.body;

    const $ = cheerio.load(body);

    const allHolidayElements = $('.block.holidays .itemsNet').children('li');
    const suitableHolidayElements = allHolidayElements.filter(function () {
      let html = $(this).html();
      // Оставляем российские праздники, международные праздники и праздники ООН
      return html.includes('/1.gif') || html.includes('/15.gif') || html.includes('/79.gif');
    });

    // Берём названия праздников из заголовков
    let holidays = suitableHolidayElements.map(function () {
      return $(this).find('.title a').text().trim();
    }).get();

    // Обрабатываем случай 31 декабря и 1 января (Новый Год)
    if (today.getMonth() === 11 && today.getDate() === 31 ||
      today.getMonth() === 0 && today.getDate() === 1) {
      holidays = holidays.filter(holiday => !/[н|Н]овы[й|м]/.test(holiday));
      holidays = ['Новый год', ...holidays];
    }

    return holidays;
  } catch (error) {
    console.log('Error: ' + JSON.stringify(error));
  }
};