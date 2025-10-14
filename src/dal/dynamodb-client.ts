import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

export interface DynamoDBConfig {
  region?: string;
  endpoint?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
}

export class DynamoDBClientFactory {
  private static instance: DynamoDBDocumentClient;

  static getInstance(config?: DynamoDBConfig): DynamoDBDocumentClient {
    if (!this.instance) {
      const clientConfig: Record<string, unknown> = {
        region: config?.region || process.env.AWS_DEFAULT_REGION || 'eu-west-1',
      };

      // For LocalStack or custom endpoint
      if (config?.endpoint || process.env.DYNAMODB_ENDPOINT) {
        clientConfig.endpoint = config?.endpoint || process.env.DYNAMODB_ENDPOINT;
        clientConfig.credentials = {
          accessKeyId: config?.accessKeyId || process.env.AWS_ACCESS_KEY_ID || 'test',
          secretAccessKey: config?.secretAccessKey || process.env.AWS_SECRET_ACCESS_KEY || 'test',
        };
      }

      const client = new DynamoDBClient(clientConfig);
      this.instance = DynamoDBDocumentClient.from(client);
    }

    return this.instance;
  }

  static reset(): void {
    // clear the singleton instance
    (this.instance as unknown) = undefined as unknown as DynamoDBDocumentClient;
  }
}
