module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js'],
  setupFiles: ['./src/__tests__/setup.js'],
  verbose: true,
  collectCoverage: false,
  testTimeout: 30000,
  // Clean up mocks between tests
  clearMocks: true,
  // Use CommonJS modules
  transform: {},
  moduleFileExtensions: ['js', 'json'],
};