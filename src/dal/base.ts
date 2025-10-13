/**
 * Base interface for all entities in the single table design
 */
export interface BaseEntity {
  pk: string;           // Partition Key
  sk: string;           // Sort Key
  gsi1pk?: string;      // Global Secondary Index 1 Partition Key
  gsi1sk?: string;      // Global Secondary Index 1 Sort Key
  gsi2pk?: string;      // Global Secondary Index 2 Partition Key
  gsi2sk?: string;      // Global Secondary Index 2 Sort Key
  entityType: string;   // Type of entity (USER, ORDER, PRODUCT, etc.)
  createdAt: string;    // ISO timestamp
  updatedAt: string;    // ISO timestamp
}

/**
 * Key prefixes for different entity types
 */
export const EntityTypes = {
  CUSTOMER: 'Customer',
  CUSTOMER_EMAIL: 'CustomerEmail',
  ORDER: 'Order', 
  PRODUCT: 'Product'
} as const;

export type EntityType = typeof EntityTypes[keyof typeof EntityTypes];

/**
 * Utility functions for creating standardized keys
 */
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
      gsi1sk: email
    };
  }

  static ordersByCustomerGSI1(customerId: string): { gsi1pk: string; gsi1sk: string } {
    return {
      gsi1pk: KeyBuilder.customerPK(customerId),
      gsi1sk: `${EntityTypes.ORDER}#`
    };
  }
}