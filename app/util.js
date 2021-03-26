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
