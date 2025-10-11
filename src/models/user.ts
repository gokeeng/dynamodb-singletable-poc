import { BaseEntity, EntityTypes, KeyBuilder } from '../dal/base';
import { Addresses, UserStatus, UserPreferences } from './common';

export interface User extends BaseEntity {
  entityType: typeof EntityTypes.USER;
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  address: Addresses;
  organizationId?: string;
  status: UserStatus;
  preferences?: UserPreferences;
}

export class UserEntity {
  static create(data: Omit<User, keyof BaseEntity>): User {
    const now = new Date().toISOString();
    const user: User = {
      ...data,
      pk: KeyBuilder.userPK(data.userId),
      sk: KeyBuilder.userSK(),
      entityType: EntityTypes.USER,
      createdAt: now,
      updatedAt: now,
      ...KeyBuilder.userByEmailGSI1(data.email)
    };

    return user;
  }

  static updateTimestamp(user: User): User {
    return {
      ...user,
      updatedAt: new Date().toISOString()
    };
  }

  static getFullName(user: User): string {
    return `${user.firstName} ${user.lastName}`;
  }
}