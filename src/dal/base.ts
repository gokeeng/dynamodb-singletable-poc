/**
 * Base interface for all entities in the single table design
 */
export interface BaseEntity {
  PK: string;           // Partition Key
  SK: string;           // Sort Key
  GSI1PK?: string;      // Global Secondary Index 1 Partition Key
  GSI1SK?: string;      // Global Secondary Index 1 Sort Key
  GSI2PK?: string;      // Global Secondary Index 2 Partition Key
  GSI2SK?: string;      // Global Secondary Index 2 Sort Key
  EntityType: string;   // Type of entity (USER, ORDER, PRODUCT, etc.)
  CreatedAt: string;    // ISO timestamp
  UpdatedAt: string;    // ISO timestamp
}

/**
 * Key prefixes for different entity types
 */
export const EntityTypes = {
  USER: 'USER',
  ORDER: 'ORDER', 
  PRODUCT: 'PRODUCT',
  REVIEW: 'REVIEW',
  ORGANIZATION: 'ORG'
} as const;

export type EntityType = typeof EntityTypes[keyof typeof EntityTypes];

/**
 * Utility functions for creating standardized keys
 */
export class KeyBuilder {
  static userPK(userId: string): string {
    return `${EntityTypes.USER}#${userId}`;
  }

  static userSK(): string {
    return `${EntityTypes.USER}#PROFILE`;
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

  static reviewPK(reviewId: string): string {
    return `${EntityTypes.REVIEW}#${reviewId}`;
  }

  static reviewSK(): string {
    return `${EntityTypes.REVIEW}#DETAILS`;
  }

  static organizationPK(orgId: string): string {
    return `${EntityTypes.ORGANIZATION}#${orgId}`;
  }

  static organizationSK(): string {
    return `${EntityTypes.ORGANIZATION}#DETAILS`;
  }

  // GSI helpers for common access patterns
  static userByEmailGSI1(email: string): { GSI1PK: string; GSI1SK: string } {
    return {
      GSI1PK: `${EntityTypes.USER}#EMAIL`,
      GSI1SK: email
    };
  }

  static ordersByUserGSI1(userId: string): { GSI1PK: string; GSI1SK: string } {
    return {
      GSI1PK: KeyBuilder.userPK(userId),
      GSI1SK: `${EntityTypes.ORDER}#`
    };
  }

  static reviewsByProductGSI2(productId: string): { GSI2PK: string; GSI2SK: string } {
    return {
      GSI2PK: KeyBuilder.productPK(productId),
      GSI2SK: `${EntityTypes.REVIEW}#`
    };
  }
}