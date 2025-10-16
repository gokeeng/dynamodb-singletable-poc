import { DynamoDBService } from '../dal/dynamodb-service';
import { CustomerEntity, CustomerEmailEntity, Customer, BaseEntity } from '../models/models';
import { CustomerCreateDto, CustomerUpdateDto, CustomerDto } from '../models/dtos';
import { toCustomerDto } from '../models/mappers';
import { KeyBuilder } from '../dal/key-builder';
import ConditionExpressionBuilder from '../dal/condition-expression-builder';

export class CustomerService {
  constructor(private dynamoService: DynamoDBService) {}

  /**
   * Create a new customer
   */
  async createCustomer(customerData: CustomerCreateDto): Promise<CustomerDto> {
    // Ensure required persistence fields are present and default optional ones
    const persistenceCustomer: Omit<Customer, keyof BaseEntity> = {
      customerId: customerData.customerId,
      email: customerData.email,
      firstName: customerData.firstName,
      lastName: customerData.lastName,
      phone: customerData.phone ?? '',
      address: customerData.address ?? {},
    };

    const customer = CustomerEntity.create(persistenceCustomer);
    const customerEmail = CustomerEmailEntity.create(persistenceCustomer);

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

    return toCustomerDto(customer as Customer);
  }

  /**
   * Get customer by ID
   */
  async getCustomerById(customerId: string): Promise<CustomerDto | null> {
    const pk = KeyBuilder.customerPK(customerId);
    const sk = KeyBuilder.customerSK(customerId);
    const res = await this.dynamoService.getItem<Customer>(pk, sk);
    if (!res) return null;
    return toCustomerDto(res);
  }

  /**
   * Update customer information
   */
  async updateCustomer(customerId: string, updates: CustomerUpdateDto): Promise<CustomerDto> {
    // Prevent updates to email through this method. Email changes require a dedicated flow.
    if (Object.prototype.hasOwnProperty.call(updates, 'email')) {
      throw new Error('Updating email is not supported via updateCustomer.');
    }
    const pk = KeyBuilder.customerPK(customerId);
    const sk = KeyBuilder.customerSK(customerId);
    const updated = await this.dynamoService.updateItem<Customer>(pk, sk, updates);
    return toCustomerDto(updated);
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
