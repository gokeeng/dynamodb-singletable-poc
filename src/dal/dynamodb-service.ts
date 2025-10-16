import {
  PutCommand,
  GetCommand,
  UpdateCommand,
  DeleteCommand,
  QueryCommand,
  ScanCommand,
  BatchWriteCommand,
  BatchGetCommand,
  TransactWriteCommand,
} from '@aws-sdk/lib-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
// no direct low-level types required; we rely on the DocumentClient wrappers from lib-dynamodb
import { DynamoDBClientFactory } from './dynamodb-client';
import { TransactWriteItem } from '@aws-sdk/client-dynamodb';
import { BaseEntity } from '../models/models';

export interface QueryOptions {
  limit?: number;
  exclusiveStartKey?: Record<string, unknown>;
  scanIndexForward?: boolean;
  filterExpression?: string;
  expressionAttributeValues?: Record<string, unknown>;
  expressionAttributeNames?: Record<string, string>;
}

export interface QueryResult<T> {
  items: T[];
  lastEvaluatedKey?: Record<string, unknown>;
  count: number;
  scannedCount: number;
}

export class DynamoDBService {
  private client: DynamoDBDocumentClient;
  private tableName: string;

  constructor(client?: DynamoDBDocumentClient, tableName?: string) {
    this.client = client || DynamoDBClientFactory.getInstance();
    this.tableName = tableName || process.env.TABLE_NAME || 'Bookstore';
  }

  // (no helper methods)

  /**
   * Put an item into the table
   */
  async putItem<T extends BaseEntity>(item: T): Promise<T> {
    const command = new PutCommand({
      TableName: this.tableName,
      Item: item,
    });

    await this.client.send(command);
    return item;
  }

  /**
   * Get an item by its primary key
   */
  async getItem<T extends BaseEntity>(pk: string, sk: string): Promise<T | null> {
    const command = new GetCommand({
      TableName: this.tableName,
      Key: { pk: pk, sk: sk },
    });

    const result = await this.client.send(command);
    return (result.Item as T) || null;
  }

  /**
   * Update an item
   */
  async updateItem<T extends BaseEntity>(
    pk: string,
    sk: string,
    updates: Partial<Omit<T, 'pk' | 'sk'>>
  ): Promise<T> {
    const updateExpression: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, unknown> = {};

    // Add UpdatedAt timestamp
    const updatesWithTimestamp = {
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    Object.entries(updatesWithTimestamp).forEach(([key, value], index) => {
      const attributeName = `#attr${index}`;
      const attributeValue = `:val${index}`;

      updateExpression.push(`${attributeName} = ${attributeValue}`);
      expressionAttributeNames[attributeName] = key;
      expressionAttributeValues[attributeValue] = value as unknown;
    });

    const command = new UpdateCommand({
      TableName: this.tableName,
      Key: { pk: pk, sk: sk },
      UpdateExpression: `SET ${updateExpression.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW',
    });

    const result = await this.client.send(command);
    return result.Attributes as T;
  }

  /**
   * Delete an item
   */
  async deleteItem(pk: string, sk: string): Promise<void> {
    const command = new DeleteCommand({
      TableName: this.tableName,
      Key: { pk: pk, sk: sk },
    });

    await this.client.send(command);
  }

  /**
   * Query items by partition key
   */
  async queryByPK<T extends BaseEntity>(
    pk: string,
    options: QueryOptions = {}
  ): Promise<QueryResult<T>> {
    const command = new QueryCommand({
      TableName: this.tableName,
      KeyConditionExpression: 'pk = :pk',
      ExpressionAttributeValues: {
        ':pk': pk,
        ...options.expressionAttributeValues,
      },
      ExpressionAttributeNames: options.expressionAttributeNames,
      FilterExpression: options.filterExpression,
      Limit: options.limit,
      ExclusiveStartKey: options.exclusiveStartKey,
      ScanIndexForward: options.scanIndexForward,
    });

    const result = await this.client.send(command);

    return {
      items: (result.Items as T[]) || [],
      lastEvaluatedKey: result.LastEvaluatedKey,
      count: result.Count || 0,
      scannedCount: result.ScannedCount || 0,
    };
  }

  /**
   * Scan items with an optional filter expression. Intended for demo/administrative use only.
   */
  async scan<T extends BaseEntity>(options: QueryOptions = {}): Promise<QueryResult<T>> {
    const command = new ScanCommand({
      TableName: this.tableName,
      FilterExpression: options.filterExpression,
      ExpressionAttributeNames: options.expressionAttributeNames,
      ExpressionAttributeValues: options.expressionAttributeValues,
      Limit: options.limit,
      ExclusiveStartKey: options.exclusiveStartKey,
    });

    const result = await this.client.send(command);

    return {
      items: (result.Items as T[]) || [],
      lastEvaluatedKey: result.LastEvaluatedKey,
      count: result.Count || 0,
      scannedCount: result.ScannedCount || 0,
    };
  }

  /**
   * Query items by partition key and sort key condition
   */
  async queryByPKAndSK<T extends BaseEntity>(
    pk: string,
    skCondition: string,
    skValue: string | number | unknown,
    options: QueryOptions = {}
  ): Promise<QueryResult<T>> {
    const expressionAttributeValues: Record<string, unknown> = {
      ':pk': pk,
      ...options.expressionAttributeValues,
    };

    // only set :sk if the skCondition references it
    if (skCondition && skCondition.includes(':sk')) {
      expressionAttributeValues[':sk'] = skValue;
    }

    const command = new QueryCommand({
      TableName: this.tableName,
      KeyConditionExpression: `pk = :pk AND ${skCondition}`,
      ExpressionAttributeValues: expressionAttributeValues,
      ExpressionAttributeNames: options.expressionAttributeNames,
      FilterExpression: options.filterExpression,
      Limit: options.limit,
      ExclusiveStartKey: options.exclusiveStartKey,
      ScanIndexForward: options.scanIndexForward,
    });

    const result = await this.client.send(command);

    return {
      items: (result.Items as T[]) || [],
      lastEvaluatedKey: result.LastEvaluatedKey,
      count: result.Count || 0,
      scannedCount: result.ScannedCount || 0,
    };
  }

  /**
   * Query GSI1
   */
  async queryGSI1<T extends BaseEntity>(
    gsi1pk: string,
    gsi1sk?: string,
    options: QueryOptions = {}
  ): Promise<QueryResult<T>> {
    let keyConditionExpression = 'gsi1pk = :gsi1pk';
    const expressionAttributeValues: Record<string, unknown> = {
      ':gsi1pk': gsi1pk,
      ...options.expressionAttributeValues,
    };

    if (gsi1sk) {
      keyConditionExpression += ' AND begins_with(gsi1sk, :gsi1sk)';
      expressionAttributeValues[':gsi1sk'] = gsi1sk;
    }

    const command = new QueryCommand({
      TableName: this.tableName,
      IndexName: 'GSI1',
      KeyConditionExpression: keyConditionExpression,
      ExpressionAttributeValues: expressionAttributeValues,
      ExpressionAttributeNames: options.expressionAttributeNames,
      FilterExpression: options.filterExpression,
      Limit: options.limit,
      ExclusiveStartKey: options.exclusiveStartKey,
      ScanIndexForward: options.scanIndexForward,
    });

    const result = await this.client.send(command);

    return {
      items: (result.Items as T[]) || [],
      lastEvaluatedKey: result.LastEvaluatedKey,
      count: result.Count || 0,
      scannedCount: result.ScannedCount || 0,
    };
  }

  /**
   * Query GSI2
   */
  async queryGSI2<T extends BaseEntity>(
    gsi2pk: string,
    gsi2sk?: string,
    options: QueryOptions = {}
  ): Promise<QueryResult<T>> {
    let keyConditionExpression = 'gsi2pk = :gsi2pk';
    const expressionAttributeValues: Record<string, unknown> = {
      ':gsi2pk': gsi2pk,
      ...options.expressionAttributeValues,
    };

    if (gsi2sk) {
      keyConditionExpression += ' AND begins_with(gsi2sk, :gsi2sk)';
      expressionAttributeValues[':gsi2sk'] = gsi2sk;
    }

    const command = new QueryCommand({
      TableName: this.tableName,
      IndexName: 'GSI2',
      KeyConditionExpression: keyConditionExpression,
      ExpressionAttributeValues: expressionAttributeValues,
      ExpressionAttributeNames: options.expressionAttributeNames,
      FilterExpression: options.filterExpression,
      Limit: options.limit,
      ExclusiveStartKey: options.exclusiveStartKey,
      ScanIndexForward: options.scanIndexForward,
    });

    const result = await this.client.send(command);

    return {
      items: (result.Items as T[]) || [],
      lastEvaluatedKey: result.LastEvaluatedKey,
      count: result.Count || 0,
      scannedCount: result.ScannedCount || 0,
    };
  }

  /**
   * Batch write items (put/delete)
   */
  async batchWrite<T extends BaseEntity>(
    putItems: T[] = [],
    // keys must match actual table attribute names (pk, sk)
    deleteKeys: Array<{ pk: string; sk: string }> = []
  ): Promise<void> {
    // Create request objects for put and delete
    const requests: Array<Record<string, unknown>> = [];

    putItems.forEach((item) => {
      requests.push({
        PutRequest: {
          Item: item,
        },
      });
    });

    deleteKeys.forEach((key) => {
      requests.push({
        DeleteRequest: {
          Key: key,
        },
      });
    });

    // DynamoDB batch write has a limit of 25 items
    const batchSize = 25;
    for (let i = 0; i < requests.length; i += batchSize) {
      let batch = requests.slice(i, i + batchSize);

      // Retry unprocessed items with exponential backoff (best-effort)
      let attempt = 0;
      const maxAttempts = 5;
      let unprocessed: Record<string, unknown> | undefined;

      do {
        const command = new BatchWriteCommand({
          RequestItems: {
            [this.tableName]: batch,
          },
        });

        // eslint-disable-next-line no-await-in-loop
        const result = await this.client.send(command);

        // `result` shape depends on the command; narrow to expected optional field
        const raw = (result as unknown as { UnprocessedItems?: Record<string, unknown> })
          .UnprocessedItems;

        if (raw && Object.keys(raw).length && Array.isArray(raw[this.tableName])) {
          // prepare next batch with the unprocessed items
          batch = raw[this.tableName] as unknown as Record<string, unknown>[];
          attempt += 1;
          // backoff
          // eslint-disable-next-line no-await-in-loop
          await new Promise((r) => setTimeout(r, Math.pow(2, attempt) * 50));
        } else {
          unprocessed = undefined;
        }
      } while (unprocessed && attempt < maxAttempts);
    }
  }

  /**
   * Batch get items
   */
  async batchGet<T extends BaseEntity>(keys: Array<{ pk: string; sk: string }>): Promise<T[]> {
    const items: T[] = [];

    // DynamoDB batch get has a limit of 100 items
    const batchSize = 100;
    for (let i = 0; i < keys.length; i += batchSize) {
      const batch = keys.slice(i, i + batchSize);

      const command = new BatchGetCommand({
        RequestItems: {
          [this.tableName]: {
            Keys: batch,
          },
        },
      });

      const result = await this.client.send(command);
      if (result.Responses?.[this.tableName]) {
        items.push(...(result.Responses[this.tableName] as T[]));
      }
    }

    return items;
  }

  /**
   * Perform a TransactWrite to put multiple items only if their conditions are satisfied.
   * Each entry can include an optional ConditionExpression and ExpressionAttributeValues/Names.
   * If any condition fails the whole transaction will fail.
   */
  async transactPutItems(
    entries: Array<{
      Item: BaseEntity;
      ConditionExpression?: string;
      ExpressionAttributeValues?: Record<string, unknown>;
      ExpressionAttributeNames?: Record<string, string>;
    }>
  ): Promise<void> {
    if (!entries || entries.length === 0) return;

    // Build TransactWriteItem[] using SDK types so we avoid `any`
    const transactItems: TransactWriteItem[] = entries.map((e) => {
      const put: Record<string, unknown> = {
        TableName: this.tableName,
        Item: e.Item as unknown as Record<string, unknown>,
      };

      if (e.ConditionExpression) {
        (put as Record<string, unknown>)['ConditionExpression'] = e.ConditionExpression;
      }

      if (e.ExpressionAttributeValues) {
        (put as Record<string, unknown>)['ExpressionAttributeValues'] =
          e.ExpressionAttributeValues as Record<string, unknown>;
      }

      if (e.ExpressionAttributeNames) {
        (put as Record<string, unknown>)['ExpressionAttributeNames'] = e.ExpressionAttributeNames;
      }

      return { Put: put } as unknown as TransactWriteItem;
    });

    const command = new TransactWriteCommand({
      TransactItems: transactItems,
    });

    await this.client.send(command);
  }

  /**
   * Perform a general TransactWrite with mixed Put/Delete/Update actions.
   * Each entry may be of the form: { Put: { Item, ... } } | { Delete: { Key, ... } } | { Update: { Key, UpdateExpression, ... } }
   */
  async transactWriteItems(
    entries: Array<
      | {
          Put: {
            Item: BaseEntity;
            ConditionExpression?: string;
            ExpressionAttributeValues?: Record<string, unknown>;
            ExpressionAttributeNames?: Record<string, string>;
          };
        }
      | {
          Delete: {
            Key: Record<string, unknown>;
            ConditionExpression?: string;
            ExpressionAttributeValues?: Record<string, unknown>;
            ExpressionAttributeNames?: Record<string, string>;
          };
        }
      | {
          Update: {
            Key: Record<string, unknown>;
            UpdateExpression: string;
            ExpressionAttributeNames?: Record<string, string>;
            ExpressionAttributeValues?: Record<string, unknown>;
            ConditionExpression?: string;
          };
        }
    >
  ): Promise<void> {
    if (!entries || entries.length === 0) return;

    // Build TransactWriteItem[] using SDK types so we avoid explicit any casts
    const transactItems: TransactWriteItem[] = entries.map((entry) => {
      const e = entry as unknown as {
        Put?: {
          Item: BaseEntity;
          ConditionExpression?: string;
          ExpressionAttributeValues?: Record<string, unknown>;
          ExpressionAttributeNames?: Record<string, string>;
        };
        Delete?: {
          Key: Record<string, unknown>;
          ConditionExpression?: string;
          ExpressionAttributeValues?: Record<string, unknown>;
          ExpressionAttributeNames?: Record<string, string>;
        };
        Update?: {
          Key: Record<string, unknown>;
          UpdateExpression: string;
          ExpressionAttributeNames?: Record<string, string>;
          ExpressionAttributeValues?: Record<string, unknown>;
          ConditionExpression?: string;
        };
      };

      if (e.Put) {
        const p = e.Put;
        const put: Record<string, unknown> = {
          TableName: this.tableName,
          Item: p.Item as unknown as Record<string, unknown>,
        };

        if (p.ConditionExpression) put['ConditionExpression'] = p.ConditionExpression;
        if (p.ExpressionAttributeValues)
          put['ExpressionAttributeValues'] = p.ExpressionAttributeValues as Record<string, unknown>;
        if (p.ExpressionAttributeNames)
          put['ExpressionAttributeNames'] = p.ExpressionAttributeNames;

        return { Put: put } as unknown as TransactWriteItem;
      }

      if (e.Delete) {
        const d = e.Delete;
        const del: Record<string, unknown> = {
          TableName: this.tableName,
          Key: d.Key,
        };

        if (d.ConditionExpression) del['ConditionExpression'] = d.ConditionExpression;
        if (d.ExpressionAttributeValues)
          del['ExpressionAttributeValues'] = d.ExpressionAttributeValues as Record<string, unknown>;
        if (d.ExpressionAttributeNames)
          del['ExpressionAttributeNames'] = d.ExpressionAttributeNames;

        return { Delete: del } as unknown as TransactWriteItem;
      }

      if (e.Update) {
        const u = e.Update;
        const upd: Record<string, unknown> = {
          TableName: this.tableName,
          Key: u.Key,
          UpdateExpression: u.UpdateExpression,
        };

        if (u.ExpressionAttributeNames)
          upd['ExpressionAttributeNames'] = u.ExpressionAttributeNames;
        if (u.ExpressionAttributeValues)
          upd['ExpressionAttributeValues'] = u.ExpressionAttributeValues as Record<string, unknown>;
        if (u.ConditionExpression) upd['ConditionExpression'] = u.ConditionExpression;

        return { Update: upd } as unknown as TransactWriteItem;
      }

      throw new Error('Invalid transact write entry');
    });

    const command = new TransactWriteCommand({
      TransactItems: transactItems,
    });

    await this.client.send(command);
  }
}
