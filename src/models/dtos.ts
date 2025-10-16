export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface CustomerCreateDto {
  customerId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  address?: Record<string, Address>;
}

export interface CustomerUpdateDto {
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: Record<string, Address>;
}

export interface OrderItemDto {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface OrderCreateDto {
  orderId: string;
  customerId: string;
  totalAmount: number;
  currency: string;
  items: OrderItemDto[];
  shippingAddress: Address;
  paymentMethod: { type: string; last4?: string; brand?: string };
  orderDate: string;
}

export interface OrderUpdateDto {
  status?: string;
  trackingNumber?: string;
}

export interface CustomerDto {
  customerId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  address?: Record<string, Address>;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItemDto {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface OrderDto {
  orderId: string;
  customerId: string;
  status: string;
  totalAmount: number;
  currency: string;
  items: OrderItemDto[];
  shippingAddress: Address | Record<string, unknown>;
  paymentMethod: { type: string; last4?: string; brand?: string } | Record<string, unknown>;
  orderDate: string;
  createdAt: string;
  updatedAt: string;
}
