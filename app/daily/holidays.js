const cheerio = require('cheerio');
const iconv = require('iconv-lite');
var request = require('request');

module.exports.getHolidays = function() {

  var promise = new Promise(function(resolve, reject) {
    request({ 
      uri: 'https://www.calend.ru',
      method: 'GET',
    }, function (error, response, body) {

      const $ = cheerio.load(body);

      let holidays = $('.block.holidays .itemsNet').children('li')
        .filter(function(i, el) {
          let html = $(this).html();
          return html.includes('/1.gif') || html.includes('/15.gif') || html.includes('/79.gif');
        })
        .map(function(i, el) {
          return $(this).find('.title a').text().trim();
        })
        .get();

      resolve(holidays);
    });
  });

  return promise;

}
