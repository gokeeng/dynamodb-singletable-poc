import { DynamoDBService } from '../dal/dynamodb-service';
import { Customer, CustomerEntity } from '../models/customer';
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
    // Prevent updates to email through this method. Email changes require a dedicated flow.
    if (Object.prototype.hasOwnProperty.call(updates, 'email')) {
      throw new Error('Updating email is not supported via updateCustomer.');
    }
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
}
