export enum HolidayCategory {
  RUSSIAN,
  WORLD,
  UN,
  ORTHODOX,
}

export const allCategories = [
  HolidayCategory.RUSSIAN,
  HolidayCategory.WORLD,
  HolidayCategory.UN,
  HolidayCategory.ORTHODOX,
];

export const holidayCategoryLinks: {[l: string]: HolidayCategory}  = {
  '/holidays/russtate/': HolidayCategory.RUSSIAN,
  '/holidays/wholeworld/': HolidayCategory.WORLD,
  '/holidays/un/': HolidayCategory.UN,
  '/holidays/orthodox/': HolidayCategory.ORTHODOX,
};

export const holidayCategoryIcons = {
  [HolidayCategory.RUSSIAN]: '\u{1F1F7}\u{1F1FA}',
  [HolidayCategory.WORLD]: '\u{1F30D}',
  [HolidayCategory.UN]: '\u{1F1FA}\u{1F1F3}',
  [HolidayCategory.ORTHODOX]: '\u{2626}',
};

export const holidayCategoryTitles = {
  [HolidayCategory.RUSSIAN]: 'Праздники России',
  [HolidayCategory.WORLD]: 'Международные праздники',
  [HolidayCategory.UN]: 'Праздники ООН',
  [HolidayCategory.ORTHODOX]: 'Православные праздники',
};
