import { DynamoDBService } from '../dal/dynamodb-service';
import { Customer, CustomerEntity } from '../models/customer';
import { UserStatus } from '../models/common';
import { BaseEntity, KeyBuilder } from '../dal/base';

export class CustomerService {
  constructor(private dynamoService: DynamoDBService) {}

  /**
   * Create a new customer
   */
  async createCustomer(customerData: Omit<Customer, keyof BaseEntity>): Promise<Customer> {
    const customer = CustomerEntity.create(customerData);
    return await this.dynamoService.putItem(customer);
  }

  /**
   * Get customer by ID
   */
  async getCustomerById(customerId: string): Promise<Customer | null> {
    const pk = KeyBuilder.customerPK(customerId);
    const sk = KeyBuilder.customerSK(customerId);
    return await this.dynamoService.getItem<Customer>(pk, sk);
  }

  /**
   * Get customer by email using GSI1
   */
  async getCustomerByEmail(email: string): Promise<Customer | null> {
    const gsi1Keys = KeyBuilder.customerByEmailGSI1(email);
    const result = await this.dynamoService.queryGSI1<Customer>(
      gsi1Keys.gsi1pk,
      gsi1Keys.gsi1sk
    );
    return result.items.length > 0 ? result.items[0]! : null;
  }

  /**
   * Update customer information
   */
  async updateCustomer(
    customerId: string,
    updates: Partial<Pick<Customer, 'firstName' | 'lastName' | 'phone' | 'address'>>
  ): Promise<Customer> {
    const pk = KeyBuilder.customerPK(customerId);
    const sk = KeyBuilder.customerSK(customerId);
    return await this.dynamoService.updateItem<Customer>(pk, sk, updates);
  }

  /**
   * Delete customer
   */
  async deleteCustomer(customerId: string): Promise<void> {
    const pk = KeyBuilder.customerPK(customerId);
    const sk = KeyBuilder.customerSK(customerId);
    await this.dynamoService.deleteItem(pk, sk);
  }

  /**
   * Search customers by name (scan operation - demo only)
   */
  async searchCustomersByName(searchTerm: string): Promise<Customer[]> {
    const result = await this.dynamoService.queryByPKAndSK<Customer>(
      'CUSTOMER#',
      'begins_with(PK, :pk)',
      'CUSTOMER#',
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

  async getActiveCustomers(limit?: number): Promise<Customer[]> {
    const result = await this.dynamoService.queryByPKAndSK<Customer>(
      'CUSTOMER#',
      'begins_with(PK, :pk)',
      'CUSTOMER#',
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
