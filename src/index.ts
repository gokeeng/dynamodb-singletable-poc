import { DynamoDBService } from './dal/dynamodb-service';

/**
 * Main entry point that demonstrates the single table design
 */
async function main(): Promise<void> {
  console.log('🚀 DynamoDB Single Table Design - Proof of Concept\n');

  try {
    // Test connection
    console.log('🔗 Testing DynamoDB connection...');
    const dynamoService = new DynamoDBService();

    // Try a simple query to test connectivity
    await dynamoService.queryByPK('TEST', { limit: 1 });
    console.log('✅ DynamoDB connection successful!\n');

    console.log('📚 This POC demonstrates:');
    console.log('  • Single table design with multiple entity types');
    console.log('  • Efficient access patterns using GSIs');
    console.log('  • TypeScript models with strong typing');
    console.log('  • Service layer abstraction');
    console.log('  • LocalStack integration for local development\n');

    console.log('🛠️  Available commands:');
    console.log('  npm run demo:seed    - Populate the table with sample data');
    console.log('  npm run demo:query   - Run query examples');
    console.log('  npm run localstack:start  - Start LocalStack');
    console.log('  npm run stack:deploy      - Deploy CloudFormation stack\n');

    console.log('📖 To get started:');
    console.log('  1. Make sure LocalStack is running: npm run localstack:start');
    console.log('  2. Deploy the DynamoDB table: npm run stack:deploy');
    console.log('  3. Seed some sample data: npm run demo:seed');
    console.log('  4. Run query examples: npm run demo:query\n');
  } catch (error) {
    console.error('❌ Error connecting to DynamoDB:', error);
    console.log('\n🔧 Troubleshooting:');
    console.log('  • Make sure LocalStack is running: docker-compose up -d');
    console.log('  • Check that the DynamoDB table exists');
    console.log('  • Verify your AWS credentials are set for LocalStack\n');
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}
