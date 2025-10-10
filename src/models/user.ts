import { BaseEntity, EntityTypes, KeyBuilder } from '../dal/base';

export interface User extends BaseEntity {
  EntityType: typeof EntityTypes.USER;
  UserId: string;
  Email: string;
  FirstName: string;
  LastName: string;
  DateOfBirth?: string;
  Phone?: string;
  Address?: Address;
  OrganizationId?: string;
  Status: UserStatus;
  Preferences?: UserPreferences;
}

export interface Address {
  Street: string;
  City: string;
  State: string;
  ZipCode: string;
  Country: string;
}

export interface UserPreferences {
  NewsletterSubscribed: boolean;
  Theme: 'light' | 'dark';
  Language: string;
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED'
}

export class UserEntity {
  static create(data: Omit<User, keyof BaseEntity>): User {
    const now = new Date().toISOString();
    const user: User = {
      ...data,
      PK: KeyBuilder.userPK(data.UserId),
      SK: KeyBuilder.userSK(),
      EntityType: EntityTypes.USER,
      CreatedAt: now,
      UpdatedAt: now,
      ...KeyBuilder.userByEmailGSI1(data.Email)
    };

    // If user belongs to an organization, set up GSI2 for org-based queries
    if (data.OrganizationId) {
      user.GSI2PK = KeyBuilder.organizationPK(data.OrganizationId);
      user.GSI2SK = KeyBuilder.userPK(data.UserId);
    }

    return user;
  }

  static updateTimestamp(user: User): User {
    return {
      ...user,
      UpdatedAt: new Date().toISOString()
    };
  }

  static getFullName(user: User): string {
    return `${user.FirstName} ${user.LastName}`;
  }
}