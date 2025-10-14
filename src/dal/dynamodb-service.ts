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
import { DynamoDBClientFactory } from './dynamodb-client';
import { BaseEntity } from './base';

export interface QueryOptions {
  limit?: number;
  exclusiveStartKey?: Record<string, any>;
  scanIndexForward?: boolean;
  filterExpression?: string;
  expressionAttributeValues?: Record<string, any>;
  expressionAttributeNames?: Record<string, any>;
}

export interface QueryResult<T> {
  items: T[];
  lastEvaluatedKey?: Record<string, any>;
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
    updates: Partial<Omit<T, 'PK' | 'SK'>>
  ): Promise<T> {
    const updateExpression: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, any> = {};

    // Add UpdatedAt timestamp
    const updatesWithTimestamp = {
      ...updates,
      UpdatedAt: new Date().toISOString(),
    };

    Object.entries(updatesWithTimestamp).forEach(([key, value], index) => {
      const attributeName = `#attr${index}`;
      const attributeValue = `:val${index}`;

      updateExpression.push(`${attributeName} = ${attributeValue}`);
      expressionAttributeNames[attributeName] = key;
      expressionAttributeValues[attributeValue] = value;
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
    skValue: any,
    options: QueryOptions = {}
  ): Promise<QueryResult<T>> {
    const expressionAttributeValues: Record<string, any> = {
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
    const expressionAttributeValues: Record<string, any> = {
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
    const expressionAttributeValues: Record<string, any> = {
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
    deleteKeys: Array<{ PK: string; SK: string }> = []
  ): Promise<void> {
    const requests: any[] = [];

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
      const batch = requests.slice(i, i + batchSize);

      const command = new BatchWriteCommand({
        RequestItems: {
          [this.tableName]: batch,
        },
      });

      await this.client.send(command);
    }
  }

  /**
   * Batch get items
   */
  async batchGet<T extends BaseEntity>(keys: Array<{ PK: string; SK: string }>): Promise<T[]> {
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
      ExpressionAttributeValues?: Record<string, any>;
      ExpressionAttributeNames?: Record<string, string>;
    }>
  ): Promise<void> {
    if (!entries || entries.length === 0) return;

    // Build TransactItems array
    const transactItems = entries.map((e) => {
      const put: any = {
        TableName: this.tableName,
        Item: e.Item,
      };

      if (e.ConditionExpression) {
        put.ConditionExpression = e.ConditionExpression;
      }

      if (e.ExpressionAttributeValues) {
        put.ExpressionAttributeValues = e.ExpressionAttributeValues;
      }

      if (e.ExpressionAttributeNames) {
        put.ExpressionAttributeNames = e.ExpressionAttributeNames;
      }

      return { Put: put };
    });

    const command = new TransactWriteCommand({
      TransactItems: transactItems,
    });

    await this.client.send(command as any);
  }
}
