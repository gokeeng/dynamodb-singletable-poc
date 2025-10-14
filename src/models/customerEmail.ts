import { BaseEntity, EntityTypes } from '../dal/base';
import { KeyBuilder } from '../dal/key-builder';
import { Customer } from './customer';

export interface CustomerEmail extends BaseEntity {
  entityType: typeof EntityTypes.CUSTOMER_EMAIL;
  createdAt: string;
  updatedAt: string;
  email: string;
  customerId: string;
}

export class CustomerEmailEntity {
  static create(data: Omit<Customer, keyof BaseEntity>): CustomerEmail {
    const now = new Date().toISOString();
    const customerEmail: CustomerEmail = {
      ...data,
      pk: KeyBuilder.customerEmailPK((data as Customer).email),
      sk: KeyBuilder.customerEmailSK((data as Customer).email),
      entityType: EntityTypes.CUSTOMER_EMAIL,
      createdAt: now,
      updatedAt: now,
    };

    return customerEmail;
  }

  static updateTimestamp(customer: CustomerEmail): CustomerEmail {
    return {
      ...customer,
      updatedAt: new Date().toISOString(),
    };
  }
}
