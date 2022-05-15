/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  silent: true,
  clearMocks: true,
  detectOpenHandles: true,
  testMatch: [
    '**/*.test.ts'
  ],
};
