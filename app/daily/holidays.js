const cheerio = require('cheerio');
const request = require('request');

module.exports.getHolidays = function() {

  return new Promise(function (resolve) {
    request({
      uri: 'https://www.calend.ru',
      method: 'GET',
    }, function (error, response, body) {

      const $ = cheerio.load(body);

      let holidays = $('.block.holidays .itemsNet').children('li')
        .filter(function () {
          let html = $(this).html();
          return html.includes('/1.gif') || html.includes('/15.gif') || html.includes('/79.gif');
        })
        .map(function () {
          return $(this).find('.title a').text().trim();
        })
        .get();

      resolve(holidays);
    });
  });

};
