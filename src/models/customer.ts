import { BaseEntity, EntityTypes, KeyBuilder } from '../dal/base';
import { Addresses } from './common';

export interface Customer extends BaseEntity {
  entityType: typeof EntityTypes.CUSTOMER;
  customerId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  address: Addresses;
}

export class CustomerEntity {
  static create(data: Omit<Customer, keyof BaseEntity>): Customer {
    const now = new Date().toISOString();
    const customer: Customer = {
      ...data,
      pk: KeyBuilder.customerPK((data as any).customerId),
      sk: KeyBuilder.customerSK((data as any).customerId),
      entityType: EntityTypes.CUSTOMER,
      createdAt: now,
      updatedAt: now,
      ...KeyBuilder.customerByEmailGSI1((data as any).email)
    };

    return customer;
  }

  static updateTimestamp(customer: Customer): Customer {
    return {
      ...customer,
      updatedAt: new Date().toISOString()
    };
  }

  static getFullName(customer: Customer): string {
    return `${customer.firstName} ${customer.lastName}`;
  }
}
