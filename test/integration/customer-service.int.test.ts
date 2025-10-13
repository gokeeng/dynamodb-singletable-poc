import { DynamoDBService } from '../../src/dal/dynamodb-service';
import { CustomerService } from '../../src/services/customer-service';
import { v4 as uuidv4 } from 'uuid';

describe('CustomerService Integration Tests', () => {
  const dynamo = new DynamoDBService();
  const userService = new CustomerService(dynamo);
  const createdUserIds: string[] = [];

  it('should create a user', async () => {
    const newUserId = `customer-${uuidv4()}`;
    const user = await userService.createCustomer({
      customerId: newUserId,
      firstName: 'Test',
      lastName: 'User',
      email: `test.user.${Date.now()}@example.com`,
      phone: '0123456789',
      address: '123 Test St',
    } as any);

    expect(user).toBeDefined();
  expect(user.customerId).toBeDefined();
  expect(user.customerId).toEqual(newUserId);
  createdUserIds.push(user.customerId);
  });

  it('should get user by id', async () => {
  const fetched = await userService.getCustomerById(createdUserIds[0]!);
    expect(fetched).not.toBeNull();
    expect(fetched!.customerId).toEqual(createdUserIds[0]);
  });

  it('should get user by email', async () => {
  const fetchedByEmail = await userService.getCustomerByEmail((await userService.getCustomerById(createdUserIds[0]!))!.email);
    expect(fetchedByEmail).not.toBeNull();
    expect(fetchedByEmail!.customerId).toEqual(createdUserIds[0]);
  });

  it('should update user', async () => {
  const updated = await userService.updateCustomer(createdUserIds[0]!, { firstName: 'Updated' });
    expect(updated.firstName).toBeDefined();
    expect(updated.firstName).toEqual('Updated');
  });

  it('should delete user', async () => {
  await userService.deleteCustomer(createdUserIds[0]!);
  const afterDelete = await userService.getCustomerById(createdUserIds[0]!);
    expect(afterDelete).toBeNull();
  });

  afterAll(async () => {
    // Cleanup any users left behind
    for (const id of createdUserIds) {
      try {
        const user = await userService.getCustomerById(id);
        if (user) {
          await userService.deleteCustomer(id);
        }
      } catch (e) {
        // ignore
      }
    }
  });
});
