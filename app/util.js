module.exports.getPluralForm = function(number, one, two, five) {
  // src: https://gist.github.com/tomfun/830fa6d8030d16007bbab50a5b21ef97
  let n = Math.abs(number);
  n %= 100;
  if (n >= 5 && n <= 20) {
    return five;
  }
  n %= 10;
  if (n === 1) {
    return one;
  }
  if (n >= 2 && n <= 4) {
    return two;
  }
  return five;
};

module.exports.getConcatenatedItems = function(items) {
  if (!items || !items.length) {
    return '';
  }
  return items.reduce((sum, cur, i, arr) => {
    if (i === arr.length - 1) {
      return `${sum} и ${cur}`;
    } else {
      return `${sum}, ${cur}`;
    }
  });
};

module.exports.getMonthNameInNominativeCase = function(monthIndex) {
  const months = ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'];
  return months[(monthIndex + 12) % 12];
};

module.exports.getMonthNameInPrepositionalCase = function(monthIndex) {
  const months = ['январе', 'феврале', 'марте', 'апреле', 'мае', 'июне', 'июле', 'августе', 'сентябре', 'октябре', 'ноябре', 'декабре'];
  return months[(monthIndex + 12) % 12];
};

module.exports.getMonthNameInInstrumentalCase = function(monthIndex) {
  const months = ['январём', 'февралём', 'мартом', 'апрелем', 'маем', 'июнем', 'июлем', 'августом', 'сентябрём', 'октябрём', 'ноябрём', 'декабрём'];
  return months[(monthIndex + 12) % 12];
};

module.exports.timeout = function(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
};
