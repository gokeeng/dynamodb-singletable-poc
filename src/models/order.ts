import { BaseEntity, EntityTypes, KeyBuilder } from '../dal/base';

export interface Order extends BaseEntity {
  EntityType: typeof EntityTypes.ORDER;
  OrderId: string;
  UserId: string;
  Status: OrderStatus;
  TotalAmount: number;
  Currency: string;
  Items: OrderItem[];
  ShippingAddress: ShippingAddress;
  PaymentMethod: PaymentMethod;
  OrderDate: string;
  ShippedDate?: string;
  DeliveredDate?: string;
  TrackingNumber?: string;
}

export interface OrderItem {
  ProductId: string;
  ProductName: string;
  Quantity: number;
  UnitPrice: number;
  TotalPrice: number;
}

export interface ShippingAddress {
  FirstName: string;
  LastName: string;
  Street: string;
  City: string;
  State: string;
  ZipCode: string;
  Country: string;
}

export interface PaymentMethod {
  Type: 'CREDIT_CARD' | 'DEBIT_CARD' | 'PAYPAL' | 'APPLE_PAY';
  Last4?: string;
  Brand?: string;
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
      PK: KeyBuilder.orderPK(data.OrderId),
      SK: KeyBuilder.orderSK(),
      EntityType: EntityTypes.ORDER,
      CreatedAt: now,
      UpdatedAt: now,
      // GSI1: Orders by User (for user's order history)
      ...KeyBuilder.ordersByUserGSI1(data.UserId),
      // GSI2: Orders by Status and Date (for admin queries)
      GSI2PK: `${EntityTypes.ORDER}#STATUS#${data.Status}`,
      GSI2SK: data.OrderDate
    };

    return order;
  }

  static updateStatus(order: Order, newStatus: OrderStatus): Order {
    const updatedOrder = {
      ...order,
      Status: newStatus,
      UpdatedAt: new Date().toISOString(),
      GSI2PK: `${EntityTypes.ORDER}#STATUS#${newStatus}`
    };

    // Update shipped/delivered dates based on status
    if (newStatus === OrderStatus.SHIPPED && !order.ShippedDate) {
      updatedOrder.ShippedDate = new Date().toISOString();
    } else if (newStatus === OrderStatus.DELIVERED && !order.DeliveredDate) {
      updatedOrder.DeliveredDate = new Date().toISOString();
    }

    return updatedOrder;
  }

  static calculateTotal(order: Order): number {
    return order.Items.reduce((total, item) => total + item.TotalPrice, 0);
  }

  static addTrackingNumber(order: Order, trackingNumber: string): Order {
    return {
      ...order,
      TrackingNumber: trackingNumber,
      UpdatedAt: new Date().toISOString()
    };
  }
}