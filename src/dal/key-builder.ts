/**
 * Utility functions for creating standardized keys
 */
import { EntityTypes } from './base';

export class KeyBuilder {
  static customerPK(customerId: string): string {
    return `${EntityTypes.CUSTOMER}#${customerId}`;
  }

  static customerSK(customerId: string): string {
    return `${EntityTypes.CUSTOMER}#${customerId}`;
  }

  static customerEmailPK(email: string): string {
    return `${EntityTypes.CUSTOMER_EMAIL}#${email}`;
  }

  static customerEmailSK(email: string): string {
    return `${EntityTypes.CUSTOMER_EMAIL}#${email}`;
  }

  static orderPK(orderId: string): string {
    return `${EntityTypes.ORDER}#${orderId}`;
  }

  static orderSK(): string {
    return `${EntityTypes.ORDER}#DETAILS`;
  }

  static productPK(productId: string): string {
    return `${EntityTypes.PRODUCT}#${productId}`;
  }

  static productSK(): string {
    return `${EntityTypes.PRODUCT}#DETAILS`;
  }

  // GSI helpers for common access patterns
  static customerByEmailGSI1(email: string): { gsi1pk: string; gsi1sk: string } {
    return {
      gsi1pk: `${EntityTypes.CUSTOMER}#EMAIL`,
      gsi1sk: email,
    };
  }

  static ordersByCustomerGSI1(customerId: string): { gsi1pk: string; gsi1sk: string } {
    return {
      gsi1pk: KeyBuilder.customerPK(customerId),
      gsi1sk: `${EntityTypes.ORDER}#`,
    };
  }
}
