import {getConcatenatedItems, getPluralForm} from './util';

describe('Plural form', () => {
  test('Plural form for 0', () => {
    expect(getPluralForm(0, 'сообщение', 'сообщения', 'сообщений')).toBe('сообщений');
  });

  test('Plural form for 1', () => {
    expect(getPluralForm(1, 'сообщение', 'сообщения', 'сообщений')).toBe('сообщение');
  });

  test('Plural form for 2', () => {
    expect(getPluralForm(2, 'сообщение', 'сообщения', 'сообщений')).toBe('сообщения');
  });

  test('Plural form for 3', () => {
    expect(getPluralForm(3, 'сообщение', 'сообщения', 'сообщений')).toBe('сообщения');
  });

  test('Plural form for 5', () => {
    expect(getPluralForm(5, 'сообщение', 'сообщения', 'сообщений')).toBe('сообщений');
  });

  test('Plural form for 6', () => {
    expect(getPluralForm(6, 'сообщение', 'сообщения', 'сообщений')).toBe('сообщений');
  });

  test('Plural form for 10', () => {
    expect(getPluralForm(10, 'сообщение', 'сообщения', 'сообщений')).toBe('сообщений');
  });

  test('Plural form for 11', () => {
    expect(getPluralForm(11, 'сообщение', 'сообщения', 'сообщений')).toBe('сообщений');
  });

  test('Plural form for 21', () => {
    expect(getPluralForm(21, 'сообщение', 'сообщения', 'сообщений')).toBe('сообщение');
  });

  test('Plural form for 22', () => {
    expect(getPluralForm(22, 'сообщение', 'сообщения', 'сообщений')).toBe('сообщения');
  });

  test('Plural form for 100', () => {
    expect(getPluralForm(100, 'сообщение', 'сообщения', 'сообщений')).toBe('сообщений');
  });

  test('Plural form for 101', () => {
    expect(getPluralForm(101, 'сообщение', 'сообщения', 'сообщений')).toBe('сообщение');
  });

  test('Plural form for 102', () => {
    expect(getPluralForm(102, 'сообщение', 'сообщения', 'сообщений')).toBe('сообщения');
  });

  test('Plural form for 105', () => {
    expect(getPluralForm(105, 'сообщение', 'сообщения', 'сообщений')).toBe('сообщений');
  });

  test('Plural form for 1000', () => {
    expect(getPluralForm(1000, 'сообщение', 'сообщения', 'сообщений')).toBe('сообщений');
  });

  test('Plural form for 1001', () => {
    expect(getPluralForm(1001, 'сообщение', 'сообщения', 'сообщений')).toBe('сообщение');
  });

  test('Plural form for 1002', () => {
    expect(getPluralForm(1002, 'сообщение', 'сообщения', 'сообщений')).toBe('сообщения');
  });

  test('Plural form for 1005', () => {
    expect(getPluralForm(1005, 'сообщение', 'сообщения', 'сообщений')).toBe('сообщений');
  });
});

describe('Concatenated items', () => {
  test('Concatenated items for 0 items', () => {
    expect(getConcatenatedItems([])).toBe('');
  });

  test('Concatenated items for 1 item', () => {
    expect(getConcatenatedItems(['Item A'])).toBe('Item A');
  });

  test('Concatenated items for 2 items', () => {
    expect(getConcatenatedItems(['Item A', 'Item B'])).toBe('Item A и Item B');
  });

  test('Concatenated items for 3 items', () => {
    expect(getConcatenatedItems(['Item A', 'Item B', 'Item C'])).toBe('Item A, Item B и Item C');
  });

  test('Concatenated items for 4 items', () => {
    expect(getConcatenatedItems(['Item A', 'Item B', 'Item C', 'Item D'])).toBe('Item A, Item B, Item C и Item D');
  });
});
