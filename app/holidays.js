const cheerio = require('cheerio');
const iconv = require('iconv-lite');
var request = require('request');

module.exports.getHolidays = function() {

  var promise = new Promise(function(resolve, reject) {
    request({ 
      uri: 'http://www.calend.ru',
      method: 'GET',
      encoding: 'binary'
    }, function (error, response, body) {

      // Перевод в нужную кодировку
      body = new Buffer(body, 'binary');
      let win1251 = iconv.decode(Buffer.from(body), 'win1251');
      body = iconv.encode(win1251, 'utf8');

      const $ = cheerio.load(body);

      let holidays = $('.famous-date').first().children('div')
        .filter(function(i, el) {
          let html = $(this).html();
          return html.includes('/1.gif') || html.includes('/15.gif') || html.includes('/79.gif');
        })
        .map(function(i, el) {
          return $(this).children('a').first().text();
        })
        .get();

      resolve(holidays);
    });
  });

  return promise;

}
