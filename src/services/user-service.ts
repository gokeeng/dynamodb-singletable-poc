import { DynamoDBService } from '../dal/dynamodb-service';
import { User, UserEntity, UserStatus, KeyBuilder } from '../models';

export class UserService {
  constructor(private dynamoService: DynamoDBService) {}

  /**
   * Create a new user
   */
  async createUser(userData: Omit<User, keyof import('../models').BaseEntity>): Promise<User> {
    const user = UserEntity.create(userData);
    return await this.dynamoService.putItem(user);
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<User | null> {
    const pk = KeyBuilder.userPK(userId);
    const sk = KeyBuilder.userSK();
    return await this.dynamoService.getItem<User>(pk, sk);
  }

  /**
   * Get user by email using GSI1
   */
  async getUserByEmail(email: string): Promise<User | null> {
    const gsi1Keys = KeyBuilder.userByEmailGSI1(email);
    const result = await this.dynamoService.queryGSI1<User>(
      gsi1Keys.gsi1pk,
      gsi1Keys.gsi1sk
    );
    
    return result.items.length > 0 ? result.items[0]! : null;
  }

  /**
   * Update user information
   */
  async updateUser(
    userId: string, 
    updates: Partial<Pick<User, 'firstName' | 'lastName' | 'phone' | 'address'>>
  ): Promise<User> {
    const pk = KeyBuilder.userPK(userId);
    const sk = KeyBuilder.userSK();
    return await this.dynamoService.updateItem<User>(pk, sk, updates);
  }

  /**
   * Delete user
   */
  async deleteUser(userId: string): Promise<void> {
    const pk = KeyBuilder.userPK(userId);
    const sk = KeyBuilder.userSK();
    await this.dynamoService.deleteItem(pk, sk);
  }

  /**
   * Search users by name (scan operation - use carefully)
   */
  async searchUsersByName(searchTerm: string): Promise<User[]> {
    // This is a scan operation which is expensive - only for demo purposes
    // In production, consider using ElasticSearch or other search solutions
    const result = await this.dynamoService.queryByPKAndSK<User>(
      'USER#',
      'begins_with(PK, :pk)',
      'USER#',
      {
        filterExpression: 'contains(#firstName, :search) OR contains(#lastName, :search)',
        expressionAttributeNames: {
          '#firstName': 'FirstName',
          '#lastName': 'LastName'
        },
        expressionAttributeValues: {
          ':search': searchTerm
        }
      }
    );

    return result.items;
  }

  /**
   * Get all active users (scan operation - use carefully)
   */
  async getActiveUsers(limit?: number): Promise<User[]> {
    const result = await this.dynamoService.queryByPKAndSK<User>(
      'USER#',
      'begins_with(PK, :pk)',
      'USER#',
      {
        filterExpression: '#status = :status',
        expressionAttributeNames: {
          '#status': 'Status'
        },
        expressionAttributeValues: {
          ':status': UserStatus.ACTIVE
        },
        limit
      }
    );

    return result.items;
  }
}