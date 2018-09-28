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

      // TODO: parse
      let holidays = [
        'Новый год',
        'День защитника Отечества',
        'Международный женский день',
        'День программиста',
      ];

      resolve(holidays);
    });
  });

  return promise;

}
