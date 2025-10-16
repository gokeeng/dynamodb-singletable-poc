import { Customer, Order, OrderItem } from './models';
import { Address, CustomerDto, OrderDto, OrderItemDto } from './dtos';

export function toCustomerDto(entity: Customer): CustomerDto {
  return {
    customerId: entity.customerId,
    email: entity.email,
    firstName: entity.firstName,
    lastName: entity.lastName,
    phone: entity.phone,
    address: (entity as unknown as { address?: Record<string, Address> }).address || {},
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  };
}

export function toOrderItemDto(item: OrderItem): OrderItemDto {
  return {
    productId: item.productId,
    productName: item.productName,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    totalPrice: item.totalPrice,
  };
}

export function toOrderDto(order: Order, items: OrderItem[] = []): OrderDto {
  const oAny = order as unknown as {
    status?: string;
    shippingAddress?: Record<string, unknown>;
    paymentMethod?: Record<string, unknown>;
  };
  return {
    orderId: order.orderId,
    customerId: order.customerId,
    status: oAny.status || 'UNKNOWN',
    totalAmount: order.totalAmount,
    currency: order.currency,
    items: items.map(toOrderItemDto),
    shippingAddress: oAny.shippingAddress || {},
    paymentMethod: oAny.paymentMethod || {},
    orderDate: (order as unknown as { orderDate?: string }).orderDate || '',
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}
