export function getPluralForm(number: number, one: string, two: string, five: string): string {
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
}

export function getConcatenatedItems(items: string[]): string {
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
}

export function getMonthNameInNominativeCase(monthIndex: number): string {
  const months = ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'];
  return months[(monthIndex + 12) % 12];
}

export function getMonthNameInPrepositionalCase(monthIndex: number): string {
  const months = ['январе', 'феврале', 'марте', 'апреле', 'мае', 'июне', 'июле', 'августе', 'сентябре', 'октябре', 'ноябре', 'декабре'];
  return months[(monthIndex + 12) % 12];
}

export function getMonthNameInInstrumentalCase(monthIndex: number): string {
  const months = ['январём', 'февралём', 'мартом', 'апрелем', 'маем', 'июнем', 'июлем', 'августом', 'сентябрём', 'октябрём', 'ноябрём', 'декабрём'];
  return months[(monthIndex + 12) % 12];
}

export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export enum Month {
  JANUARY,
  FEBRUARY,
  MARCH,
  APRIL,
  MAY,
  JUNE,
  JULY,
  AUGUST,
  SEPTEMBER,
  OCTOBER,
  NOVEMBER,
  DECEMBER,
}
