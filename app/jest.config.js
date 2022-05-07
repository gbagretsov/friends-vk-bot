/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  silent: true,
  clearMocks: true,
  detectOpenHandles: true,
  testMatch: [
    '**/chat.test.ts',
    '**/custom-reactions.test.ts',
    '**/daily.test.ts',
    '**/holidays.test.ts',
  ], // TODO: add all test files when they are fixed
};
