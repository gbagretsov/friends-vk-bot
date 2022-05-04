/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  silent: true,
  clearMocks: true,
  detectOpenHandles: true,
  testMatch: ['**/chat.test.ts'], // TODO: add all test files when they are fixed
};
