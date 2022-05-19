export const holidayCategories = [
  'Праздники России',
  'Международные праздники',
  'Праздники ООН',
] as const;

export type HolidayCategory = typeof holidayCategories[number];
