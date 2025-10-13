import { BaseEntity, EntityTypes, KeyBuilder } from '../dal/base';
import { Address } from './common';

export interface Order extends BaseEntity {
  entityType: typeof EntityTypes.ORDER;
  orderId: string;
  customerId: string;
  status: OrderStatus;
  totalAmount: number;
  currency: string;
  items: OrderItem[];
  shippingAddress: Address;
  paymentMethod: PaymentMethod;
  orderDate: string;
  shippedDate?: string;
  deliveredDate?: string;
  trackingNumber?: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
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
  REFUNDED = 'REFUNDED'
}

export class OrderEntity {
  static create(data: Omit<Order, keyof BaseEntity>): Order {
    const now = new Date().toISOString();
    const order: Order = {
      ...data,
      pk: KeyBuilder.orderPK(data.orderId),
      sk: KeyBuilder.orderSK(),
      entityType: EntityTypes.ORDER,
      createdAt: now,
      updatedAt: now,
  // GSI1: Orders by Customer (for customer's order history)
  ...KeyBuilder.ordersByCustomerGSI1((data as any).customerId),
      // GSI2: Orders by Status and Date (for admin queries)
      gsi2pk: `${EntityTypes.ORDER}#STATUS#${data.status}`,
      gsi2sk: data.orderDate
    };

    return order;
  }

  static updateStatus(order: Order, newStatus: OrderStatus): Order {
    const updatedOrder = {
      ...order,
      status: newStatus,
      updatedAt: new Date().toISOString(),
      gsi2pk: `${EntityTypes.ORDER}#STATUS#${newStatus}`
    };

    // Update shipped/delivered dates based on status
    if (newStatus === OrderStatus.SHIPPED && !order.shippedDate) {
      updatedOrder.shippedDate = new Date().toISOString();
    } else if (newStatus === OrderStatus.DELIVERED && !order.deliveredDate) {
      updatedOrder.deliveredDate = new Date().toISOString();
    }

    return updatedOrder;
  }

  static calculateTotal(order: Order): number {
    return order.items.reduce((total: number, item: OrderItem) => total + item.totalPrice, 0);
  }

  static addTrackingNumber(order: Order, trackingNumber: string): Order {
    return {
      ...order,
      trackingNumber: trackingNumber,
      updatedAt: new Date().toISOString()
    };
  }
}