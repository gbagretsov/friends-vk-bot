import {VkPhoto, VkPhotoSize} from './vk/model/VkPhoto';
import {createCanvas, Image, loadImage, registerFont} from 'canvas';

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

export function truncate(text: string, maxLength: number): string {
  return (text.length > maxLength) ? text.substring(0, maxLength - 1) + '\u2026' : text;
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

export function getLargestPhotoSize(photo: VkPhoto): VkPhotoSize {
  return photo.sizes.sort((a, b) => {
    if (a.height > b.height && a.width > b.width) {
      return -1;
    }
    if (a.height < b.height && a.width < b.width) {
      return 1;
    }
    return 0;
  })[0];
}

export function isBotMentioned(text: string): boolean {
  return text.toLowerCase().startsWith('бот,') || text.includes(`club${process.env.VK_GROUP_ID}`);
}

export async function getLeaderBoardPhoto(winnerPhotoBuffer: Buffer, mainText: string, secondaryText: string, tertiaryText: string): Promise<Buffer> {
  const templateImage = await loadImage('assets/leaderboardPhotoTemplate.jpg');
  registerFont('assets/book-antiqua.ttf', { family: 'Book Antiqua', weight: 'normal' });
  registerFont('assets/book-antiqua-bold.ttf', { family: 'Book Antiqua', weight: 'bold' });

  const canvas = createCanvas(templateImage.width, templateImage.height);
  const context = canvas.getContext('2d');
  context.quality = 'best';
  context.patternQuality = 'best';
  context.drawImage(templateImage, 0, 0, templateImage.width, templateImage.height);

  const winnerImage = await loadImage(winnerPhotoBuffer);
  const winnerImageDrawArea = getWinnerImageDrawArea(winnerImage);
  const padding = 20;
  context.fillStyle = '#b5a08b';
  context.fillRect(
    winnerImageDrawArea.x,
    winnerImageDrawArea.y,
    winnerImageDrawArea.width,
    winnerImageDrawArea.height
  );
  context.drawImage(
    winnerImage,
    winnerImageDrawArea.x + padding,
    winnerImageDrawArea.y + padding,
    winnerImageDrawArea.width - 2 * padding,
    winnerImageDrawArea.height - 2 * padding
  );

  context.font = 'bold 18pt \'Book Antiqua\'';
  context.textAlign = 'center';
  context.fillStyle = '#3c3429';
  context.fillText(mainText, templateImage.width / 2, 113);
  context.fillText(secondaryText, templateImage.width / 2, 658);

  context.font = '14pt \'Book Antiqua\'';
  context.fillText(tertiaryText, templateImage.width / 2, 682);

  return canvas.toBuffer('image/jpeg');
}

function getWinnerImageDrawArea(winnerImage: Image) {
  const winnerImageAvailableDrawArea = {
    x: 98,
    y: 165,
    width: 440,
    height: 440,
  };

  const actualWidth = winnerImage.width;
  const actualHeight = winnerImage.height;

  let resultWidth = winnerImageAvailableDrawArea.width;
  let resultX = winnerImageAvailableDrawArea.x;
  let resultHeight = resultWidth / actualWidth * actualHeight;
  let resultY = (winnerImageAvailableDrawArea.height - resultHeight) / 2 + winnerImageAvailableDrawArea.y;

  if (resultHeight > winnerImageAvailableDrawArea.height) {
    resultHeight = winnerImageAvailableDrawArea.height;
    resultY = winnerImageAvailableDrawArea.y;
    resultWidth = resultHeight / actualHeight * actualWidth;
    resultX = (winnerImageAvailableDrawArea.width - resultWidth) / 2 + winnerImageAvailableDrawArea.x;
  }

  return {
    x: resultX,
    y: resultY,
    width: resultWidth,
    height: resultHeight,
  };
}
