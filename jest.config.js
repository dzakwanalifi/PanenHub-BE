// file: jest.config.js

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFiles: ['dotenv/config'], // Memuat variabel dari .env untuk testing
  testMatch: ['**/__tests__/**/*.test.ts'], // Pola file test
  verbose: true,
  forceExit: true, // Memaksa Jest keluar setelah test selesai
  clearMocks: true,
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.test.ts',
    '!src/**/*.d.ts',
  ],
}; 