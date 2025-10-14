import { DynamoDBService } from '../../src/dal/dynamodb-service';
import { CustomerService } from '../../src/services/customer-service';
import { v4 as uuidv4 } from 'uuid';

describe('CustomerService Integration Tests', () => {
  const dynamo = new DynamoDBService();
  const customerService = new CustomerService(dynamo);
  const createdCustomerIds: string[] = [];
  const customerId = `customer-${uuidv4()}`;
  const customerEmail = `test.customer.${Date.now()}@example.com`;

  it('should create a customer', async () => {
    const customer = await customerService.createCustomer({
      customerId: customerId,
      firstName: 'Test',
      lastName: 'Customer',
      email: customerEmail,
      phone: '0123456789',
      address: '123 Test St',
    } as any);

    expect(customer).toBeDefined();
    expect(customer.customerId).toBeDefined();
    expect(customer.customerId).toEqual(customerId);
    createdCustomerIds.push(customer.customerId);
  });

  it('should fail to create a customer with the same id', async () => {
    await expect(
      customerService.createCustomer({
        customerId: customerId,
        firstName: 'Test',
        lastName: 'Customer',
        email: `test.customer.${Date.now()}@example.com`,
        phone: '0123456789',
        address: '123 Test St',
      } as any)
    ).rejects.toThrow();
  });

  it('should fail to create a customer with the same email address', async () => {
    await expect(
      customerService.createCustomer({
        customerId: `customer-${uuidv4()}`,
        firstName: 'Test',
        lastName: 'Customer',
        email: customerEmail,
        phone: '0123456789',
        address: '123 Test St',
      } as any)
    ).rejects.toThrow();
  });

  it('should get customer by id', async () => {
    const fetched = await customerService.getCustomerById(createdCustomerIds[0]!);
    expect(fetched).not.toBeNull();
    expect(fetched!.customerId).toEqual(createdCustomerIds[0]);
  });

  it('should update customer', async () => {
    const updated = await customerService.updateCustomer(createdCustomerIds[0]!, {
      firstName: 'Updated',
    });
    expect(updated.firstName).toBeDefined();
    expect(updated.firstName).toEqual('Updated');
  });

  it('should delete customer', async () => {
    await customerService.deleteCustomer(createdCustomerIds[0]!);
    const afterDelete = await customerService.getCustomerById(createdCustomerIds[0]!);
    expect(afterDelete).toBeNull();
  });

  afterAll(async () => {
    // Cleanup any customers left behind
    for (const id of createdCustomerIds) {
      try {
        const customer = await customerService.getCustomerById(id);
        if (customer) {
          await customerService.deleteCustomer(id);
        }
      } catch (e) {
        // ignore
      }
    }
  });
});
