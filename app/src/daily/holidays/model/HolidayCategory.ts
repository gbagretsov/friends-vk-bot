export const holidayCategories = [
  'Праздники России',
  'Международные праздники',
  'Праздники ООН',
  'Православные праздники',
] as const;

export const holidayCategoryIcons = [
  '\u{1F1F7}\u{1F1FA}',
  '\u{1F30D}',
  '\u{1F1FA}\u{1F1F3}',
  '\u{2626}',
];

export type HolidayCategory = typeof holidayCategories[number];
