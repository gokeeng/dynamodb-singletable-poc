import { DynamoDBService, QueryResult } from "../src/dal/dynamodb-service";
import { BaseEntity } from "../src/models/models";

async function clearSeed(): Promise<void> {
  const dynamo = new DynamoDBService();
  console.log('🧹 Starting seed clear...');

  try {
    const toDelete: Array<{ pk: string; sk: string }> = [];

    // Scan the whole table and collect keys for entities that look like seed data.
    // We consider the common seeded entity types used by the examples.
    const seededTypes = new Set(['Customer', 'CustomerEmail', 'Product', 'Order', 'Item']);

    let exclusiveStartKey: Record<string, unknown> | undefined = undefined;

    do {
      const res: QueryResult<BaseEntity> = await dynamo.scan<BaseEntity>({ exclusiveStartKey });

      const matched = (res.items || []).filter((it) => seededTypes.has(it.entityType));

      for (const item of matched) {
        if (item.pk && item.sk) toDelete.push({ pk: item.pk, sk: item.sk });
      }

      exclusiveStartKey = res.lastEvaluatedKey;
    } while (exclusiveStartKey);

    if (toDelete.length === 0) {
      console.log('✅ No seed items found to delete.');
      return;
    }

    console.log(`🗑️  Deleting ${toDelete.length} items in batches...`);

    // DynamoDBService.batchWrite will chunk into 25-item batches.
    await dynamo.batchWrite([], toDelete);

    console.log('🎉 Seed data cleared successfully!');
  } catch (err) {
    console.error('❌ Error clearing seed data:', err);
    process.exitCode = 1;
  }
}

if (require.main === module) {
  clearSeed().catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  });
}

export { clearSeed };
