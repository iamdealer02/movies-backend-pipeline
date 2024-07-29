module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/src/**/*.spec.ts'],
  testPathIgnorePatterns: ['dist', 'node_modules'],
  collectCoverage: true,
  testTimeout: 30000,
  openHandlesTimeout: 5000,
};
