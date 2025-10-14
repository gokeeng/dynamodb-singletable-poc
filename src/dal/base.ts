/**
 * Base interface for all entities in the single table design
 */
export interface BaseEntity {
  pk: string; // Partition Key
  sk: string; // Sort Key
  gsi1pk?: string; // Global Secondary Index 1 Partition Key
  gsi1sk?: string; // Global Secondary Index 1 Sort Key
  gsi2pk?: string; // Global Secondary Index 2 Partition Key
  gsi2sk?: string; // Global Secondary Index 2 Sort Key
  entityType: string; // Type of entity (USER, ORDER, PRODUCT, etc.)
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}

/**
 * Key prefixes for different entity types
 */
export const EntityTypes = {
  CUSTOMER: 'Customer',
  CUSTOMER_EMAIL: 'CustomerEmail',
  ORDER: 'Order',
  PRODUCT: 'Product',
} as const;

export type EntityType = (typeof EntityTypes)[keyof typeof EntityTypes];
