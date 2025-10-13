import { DynamoDBService } from '../../src/dal/dynamodb-service';
import { UserService } from '../../src/services/user-service';
import { v4 as uuidv4 } from 'uuid';

describe('UserService Integration Tests', () => {
  const dynamo = new DynamoDBService();
  const userService = new UserService(dynamo);
  const createdUserIds: string[] = [];

  it('should create a user', async () => {
    const newUserId = `user-${uuidv4()}`;
    const user = await userService.createUser({
      userId: newUserId,
      firstName: 'Test',
      lastName: 'User',
      email: `test.user.${Date.now()}@example.com`,
      phone: '0123456789',
      address: '123 Test St',
    } as any);

    expect(user).toBeDefined();
    expect(user.userId).toBeDefined();
    expect(user.userId).toEqual(newUserId);
    createdUserIds.push(user.userId);
  });

  it('should get user by id', async () => {
  const fetched = await userService.getUserById(createdUserIds[0]!);
    expect(fetched).not.toBeNull();
    expect(fetched!.userId).toEqual(createdUserIds[0]);
  });

  it('should get user by email', async () => {
  const fetchedByEmail = await userService.getUserByEmail((await userService.getUserById(createdUserIds[0]!))!.email);
    expect(fetchedByEmail).not.toBeNull();
    expect(fetchedByEmail!.userId).toEqual(createdUserIds[0]);
  });

  it('should update user', async () => {
  const updated = await userService.updateUser(createdUserIds[0]!, { firstName: 'Updated' });
    expect(updated.firstName).toBeDefined();
    expect(updated.firstName).toEqual('Updated');
  });

  it('should delete user', async () => {
  await userService.deleteUser(createdUserIds[0]!);
  const afterDelete = await userService.getUserById(createdUserIds[0]!);
    expect(afterDelete).toBeNull();
  });

  afterAll(async () => {
    // Cleanup any users left behind
    for (const id of createdUserIds) {
      try {
        const user = await userService.getUserById(id);
        if (user) {
          await userService.deleteUser(id);
        }
      } catch (e) {
        // ignore
      }
    }
  });
});
