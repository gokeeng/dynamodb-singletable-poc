module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/test/**/*.int.test.ts'],
  // Configure ts-jest using the transform option to avoid the deprecated globals usage
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.test.json' }]
  },
  // Ensure test environment and LocalStack setup runs before tests
  setupFiles: ['<rootDir>/test/integration/setup.ts'],
  testTimeout: 30000
};
