import { DynamoDBService } from '../dal/dynamodb-service';
import { Customer, CustomerEntity } from '../models/customer';
import { UserStatus } from '../models/common';
import { BaseEntity } from '../dal/base';
import { KeyBuilder } from '../dal/key-builder';
import { CustomerEmailEntity } from '../models/customerEmail';
import ConditionExpressionBuilder from '../dal/condition-expression-builder';
export class CustomerService {
  constructor(private dynamoService: DynamoDBService) {}

  /**
   * Create a new customer
   */
  async createCustomer(customerData: Omit<Customer, keyof BaseEntity>): Promise<Customer> {
    const customer = CustomerEntity.create(customerData);
    const customerEmail = CustomerEmailEntity.create(customerData);

    await this.dynamoService.transactPutItems([
      {
        Item: customer,
        ...ConditionExpressionBuilder.attributeNotExists('pk'),
      },
      {
        Item: customerEmail,
        ...ConditionExpressionBuilder.attributeNotExists('pk'),
      },
    ]);

    return customer as Customer;
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
    const result = await this.dynamoService.scan<Customer>({
      filterExpression: 'contains(#firstName, :search) OR contains(#lastName, :search)',
      expressionAttributeNames: {
        '#firstName': 'FirstName',
        '#lastName': 'LastName',
      },
      expressionAttributeValues: {
        ':search': searchTerm,
      },
      limit: 50,
    });

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
          '#status': 'Status',
        },
        expressionAttributeValues: {
          ':status': UserStatus.ACTIVE,
        },
        limit,
      }
    );

    return result.items;
  }
}
