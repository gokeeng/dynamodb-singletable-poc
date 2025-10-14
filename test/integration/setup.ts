import { execSync } from 'child_process';

// Ensure LocalStack env variables are present for tests
process.env.AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID || 'test';
process.env.AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY || 'test';
process.env.AWS_DEFAULT_REGION = process.env.AWS_DEFAULT_REGION || 'eu-west-1';
process.env.DYNAMODB_ENDPOINT = process.env.DYNAMODB_ENDPOINT || 'http://localhost:4566';
process.env.TABLE_NAME = process.env.TABLE_NAME || 'Bookstore';

// Synchronous wait for LocalStack using curl in a loop to avoid open handles
const maxAttempts = 30;
for (let attempt = 1; attempt <= maxAttempts; attempt++) {
  try {
    execSync(`curl -s ${process.env.DYNAMODB_ENDPOINT}/health`, { stdio: 'ignore' });
    break;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.log(`Waiting for LocalStack... (${attempt}/${maxAttempts})`);
    try {
      execSync('sleep 1');
    } catch (e) {
      /* ignore */
    }
    if (attempt === maxAttempts) {
      throw new Error('LocalStack did not become ready in time');
    }
  }
}

export {};
