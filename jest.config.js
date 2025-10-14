module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/test/**/*.int.test.ts'],
  // Configure ts-jest using the transform option to avoid the deprecated globals usage
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.test.json' }],
  },
  // Ensure test environment and LocalStack setup runs before tests
  setupFiles: ['<rootDir>/test/integration/setup.ts'],
  testTimeout: 30000,
  // Run tests serially to avoid circular reference issues with AWS SDK
  maxWorkers: 1,
  // Avoid serialization issues by running in-process
  testRunner: 'jest-circus/runner',
};
