import { KeyBuilder } from '../dal/key-builder';

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
  entityType: string; // Discriminator for the entity type
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}

/**
 * Key prefixes for different entity types
 */
export enum EntityTypes {
  CUSTOMER = 'Customer',
  CUSTOMER_EMAIL = 'CustomerEmail',
  ORDER = 'Order',
  ORDER_ITEM = 'Item',
  PRODUCT = 'Product',
}

export type EntityType = EntityTypes;

// common.ts
export interface Addresses {
  [name: string]: Address;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

// customer.ts
export interface Customer extends BaseEntity {
  entityType: EntityTypes.CUSTOMER;
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
      pk: KeyBuilder.customerPK((data as Customer).customerId),
      sk: KeyBuilder.customerSK((data as Customer).customerId),
      entityType: EntityTypes.CUSTOMER,
      createdAt: now,
      updatedAt: now,
    };

    return customer;
  }

  static updateTimestamp(customer: Customer): Customer {
    return {
      ...customer,
      updatedAt: new Date().toISOString(),
    };
  }

  static getFullName(customer: Customer): string {
    return `${customer.firstName} ${customer.lastName}`;
  }
}

// customerEmail.ts
export interface CustomerEmail extends BaseEntity {
  entityType: EntityTypes.CUSTOMER_EMAIL;
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

// product.ts
export interface Product extends BaseEntity {
  entityType: EntityTypes.PRODUCT;
  productId: string;
  name: string;
  description: string;
  category: string;
  brand: string;
  price: number;
  currency: string;
  sku: string;
  stock: number;
  images: string[];
  attributes: ProductAttribute[];
  status: ProductStatus;
  averageRating?: number;
  reviewCount?: number;
  tags: string[];
}

export interface ProductAttribute {
  name: string;
  value: string;
  type: 'TEXT' | 'NUMBER' | 'BOOLEAN' | 'COLOR' | 'SIZE';
}

export enum ProductStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  OUT_OF_STOCK = 'OUT_OF_STOCK',
  DISCONTINUED = 'DISCONTINUED',
}

export class ProductEntity {
  static create(data: Omit<Product, keyof BaseEntity>): Product {
    const now = new Date().toISOString();
    const product: Product = {
      ...data,
      pk: KeyBuilder.productPK(data.productId),
      sk: KeyBuilder.productSK(),
      entityType: EntityTypes.PRODUCT,
      createdAt: now,
      updatedAt: now,
      // GSI1: Products by Category (for browsing)
      gsi1pk: `${EntityTypes.PRODUCT}#CATEGORY#${data.category}`,
      gsi1sk: `${data.brand}#${data.name}`,
      // GSI2: Products by Brand (for brand-specific queries)
      gsi2pk: `${EntityTypes.PRODUCT}#BRAND#${data.brand}`,
      gsi2sk: `${data.category}#${data.name}`,
    };

    return product;
  }

  static updateStock(product: Product, newStock: number): Product {
    const updatedProduct = {
      ...product,
      stock: newStock,
      updatedAt: new Date().toISOString(),
    };

    if (newStock === 0 && product.status === ProductStatus.ACTIVE) {
      updatedProduct.status = ProductStatus.OUT_OF_STOCK;
    } else if (newStock > 0 && product.status === ProductStatus.OUT_OF_STOCK) {
      updatedProduct.status = ProductStatus.ACTIVE;
    }

    return updatedProduct;
  }

  static updateRating(product: Product, averageRating: number, reviewCount: number): Product {
    return {
      ...product,
      averageRating: Math.round(averageRating * 10) / 10,
      reviewCount: reviewCount,
      updatedAt: new Date().toISOString(),
    };
  }

  static isInStock(product: Product): boolean {
    return product.stock > 0 && product.status === ProductStatus.ACTIVE;
  }

  static getDisplayPrice(product: Product): string {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: product.currency,
    });
    return formatter.format(product.price);
  }
}

// orderItem.ts
export interface OrderItem extends BaseEntity {
  orderId: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export class OrderItemEntity {
  static create(data: Omit<OrderItem, keyof BaseEntity>): OrderItem {
    const now = new Date().toISOString();
    const totalPrice =
      typeof data.totalPrice === 'number' ? data.totalPrice : data.unitPrice * data.quantity;

    const item: OrderItem = {
      ...data,
      totalPrice,
      pk: KeyBuilder.orderItemPK(data.orderId, data.productId),
      sk: KeyBuilder.orderItemSK(data.orderId, data.productId),
      entityType: EntityTypes.ORDER_ITEM,
      createdAt: now,
      updatedAt: now,
      // GSI1: Orders
      ...KeyBuilder.orderItemsGSI1(data.orderId, data.productId),
    };

    return item;
  }
}

// order.ts
export interface Order extends BaseEntity {
  entityType: EntityTypes.ORDER;
  orderId: string;
  customerId: string;
  status: OrderStatus;
  totalAmount: number;
  currency: string;
  shippingAddress: Address;
  paymentMethod: PaymentMethod;
  orderDate: string;
  shippedDate?: string;
  deliveredDate?: string;
  trackingNumber?: string;
}

export interface PaymentMethod {
  type: 'CREDIT_CARD' | 'DEBIT_CARD' | 'PAYPAL' | 'APPLE_PAY';
  last4?: string;
  brand?: string;
}

export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

export class OrderEntity {
  static create(data: Omit<Order, keyof BaseEntity>): Order {
    const now = new Date().toISOString();
    const order: Order = {
      ...data,
      pk: KeyBuilder.orderPK(data.customerId),
      sk: KeyBuilder.orderSK(data.orderId),
      entityType: EntityTypes.ORDER,
      createdAt: now,
      updatedAt: now,
      // GSI1: Orders
      ...KeyBuilder.ordersGSI1(data.orderId),
    };

    return order;
  }

  static updateStatus(order: Order, newStatus: OrderStatus): Order {
    const updatedOrder = {
      ...order,
      status: newStatus,
      updatedAt: new Date().toISOString(),
      gsi2pk: `${EntityTypes.ORDER}#STATUS#${newStatus}`,
    };

    if (newStatus === OrderStatus.SHIPPED && !order.shippedDate) {
      updatedOrder.shippedDate = new Date().toISOString();
    } else if (newStatus === OrderStatus.DELIVERED && !order.deliveredDate) {
      updatedOrder.deliveredDate = new Date().toISOString();
    }

    return updatedOrder;
  }

  static addTrackingNumber(order: Order, trackingNumber: string): Order {
    return {
      ...order,
      trackingNumber,
      updatedAt: new Date().toISOString(),
    };
  }
}
