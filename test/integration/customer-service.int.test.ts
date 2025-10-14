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

  it('should add an address to a customer', async () => {
    // create a fresh customer for address tests
    const id = `customer-${uuidv4()}`;
    const email = `addr.test.${Date.now()}@example.com`;
    const customer = await customerService.createCustomer({
      customerId: id,
      firstName: 'Addr',
      lastName: 'Tester',
      email,
      phone: '0000000000',
      address: {},
    } as any);

    createdCustomerIds.push(id);

    // Add an address by updating the Addresses map
    const newAddress = {
      street: '10 Downing St',
      city: 'London',
      state: 'LDN',
      zipCode: 'SW1A 2AA',
      country: 'UK',
    };

    const updates: any = { address: { Home: newAddress } };

    const updated = await customerService.updateCustomer(id, updates);
    expect(updated).toBeDefined();
    expect(updated.address).toBeDefined();
    expect((updated.address as any).Home).toBeDefined();
    expect((updated.address as any).Home.street).toEqual('10 Downing St');
  });

  it('should update an existing address for a customer', async () => {
    const id = createdCustomerIds[createdCustomerIds.length - 1]!;

    const updatedAddress = {
      street: '1600 Pennsylvania Ave NW',
      city: 'Washington',
      state: 'DC',
      zipCode: '20500',
      country: 'USA',
    };

    // replace Home address
    const updates: any = { address: { Home: updatedAddress } };

    const updated = await customerService.updateCustomer(id, updates);
    expect(updated).toBeDefined();
    expect((updated.address as any).Home).toBeDefined();
    expect((updated.address as any).Home.city).toEqual('Washington');
  });

  it('should delete an address from a customer', async () => {
    const id = createdCustomerIds[createdCustomerIds.length - 1]!;

    // To delete an attribute in DynamoDB update, set it to null in this service implementation
    // The DynamoDBService.updateItem implementation treats any provided key/value as set operations.
    // Here we remove the address by setting the address attribute to an empty object.
    const updates: any = { address: {} };

    const updated = await customerService.updateCustomer(id, updates);
    expect(updated).toBeDefined();
    // address should be an object (empty) or missing depending on implementation
    expect(updated.address).toBeDefined();
    expect(Object.keys(updated.address || {}).length).toBe(0);
  });

  it('should not allow updating email via updateCustomer', async () => {
    const id = createdCustomerIds[createdCustomerIds.length - 1]!;

    // Attempt to update email via the updateCustomer method (should be rejected)
    await expect(
      // cast to any to simulate a caller attempting to pass email
      customerService.updateCustomer(id, { email: 'new.email@example.com' } as any)
    ).rejects.toThrow(/Updating email is not supported/);
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
