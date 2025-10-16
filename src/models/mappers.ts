import { Customer, Order, OrderItem } from './models';
import { Address, CustomerDto, OrderDto, OrderItemDto } from './dtos';

export function toCustomerDto(entity: Customer): CustomerDto {
  return {
    customerId: entity.customerId,
    email: entity.email,
    firstName: entity.firstName,
    lastName: entity.lastName,
    phone: entity.phone,
    address: (entity.address as Record<string, Address>) || {},
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
  const status = order.status ?? 'UNKNOWN';
  const shippingAddress =
    (order as unknown as { shippingAddress?: Record<string, unknown> }).shippingAddress || {};
  const paymentMethod =
    (order as unknown as { paymentMethod?: Record<string, unknown> }).paymentMethod || {};
  return {
    orderId: order.orderId,
    customerId: order.customerId,
    status,
    totalAmount: order.totalAmount,
    currency: order.currency,
    items: items.map(toOrderItemDto),
    shippingAddress,
    paymentMethod,
    orderDate: (order as unknown as { orderDate?: string }).orderDate || '',
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}
