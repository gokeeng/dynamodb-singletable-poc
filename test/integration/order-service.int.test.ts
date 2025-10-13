import { DynamoDBService } from '../../src/dal/dynamodb-service';
import { OrderService } from '../../src/services/order-service';
import { CustomerService } from '../../src/services/customer-service';
import { OrderStatus } from '../../src/models/order';

describe('OrderService Integration Tests', () => {
  const dynamo = new DynamoDBService();
  const orderService = new OrderService(dynamo);
  const createdOrderIds: string[] = [];
    const createdCustomerIds: string[] = [];
    let orderId: string | undefined;
    let customerId: string | undefined;

  it('should create an order', async () => {
    // create a user to attach an order to
    const userService = new CustomerService(dynamo);
    const userRes = await userService.createCustomer({
      customerId: `customer-${Date.now()}`,
      firstName: 'Order',
      lastName: 'Tester',
      email: `order.tester.${Date.now()}@example.com`,
      phone: '000',
      address: 'Nowhere'
    } as any);

  customerId = userRes.customerId;
  createdCustomerIds.push(customerId);

    const newOrderId = `order-${Date.now()}`;
    const order = await orderService.createOrder({
      orderId: newOrderId,
        customerId: customerId,
      items: [
        {
          productId: 'p1',
          productName: 'Test Product',
          quantity: 1,
          unitPrice: 10,
          totalPrice: 10
        }
      ],
      totalAmount: 10,
      currency: 'EUR',
      shippingAddress: { line1: '123 Test St', city: 'Testville', country: 'GB', postalCode: '00000' },
      paymentMethod: { type: 'CREDIT_CARD', last4: '4242', brand: 'VISA' },
      orderDate: new Date().toISOString(),
      status: OrderStatus.PROCESSING
    } as any);

    expect(order).toBeDefined();
    expect(order.orderId).toBeDefined();
  createdOrderIds.push(order.orderId);
  orderId = order.orderId;
  });

  it('should get order by id', async () => {
  const fetched = await orderService.getOrderById(createdOrderIds[0]!);
    expect(fetched).not.toBeNull();
    expect(fetched!.orderId).toEqual(createdOrderIds[0]);
  });

  it('should get orders by user', async () => {
  const orders = await orderService.getOrdersByCustomer(createdCustomerIds[0]!);
    expect(orders.length).toBeGreaterThanOrEqual(1);
  });

  it('should update order status', async () => {
  const updated = await orderService.updateOrderStatus(createdOrderIds[0]!, OrderStatus.DELIVERED);
    expect(updated.status).toEqual(OrderStatus.DELIVERED);
  });

  it('should delete order', async () => {
  await orderService.deleteOrder(createdOrderIds[0]!);
  const after = await orderService.getOrderById(createdOrderIds[0]!);
    expect(after).toBeNull();
  });

  afterAll(async () => {
    // Cleanup orders
    for (const id of createdOrderIds) {
      try {
        const o = await orderService.getOrderById(id);
        if (o) {
          await orderService.deleteOrder(id);
        }
      } catch (e) {
        // ignore
      }
    }

    // Cleanup users
  const userService = new CustomerService(dynamo);
  for (const id of createdCustomerIds) {
      try {
        const u = await userService.getCustomerById(id);
        if (u) {
          await userService.deleteCustomer(id);
        }
      } catch (e) {
        // ignore
      }
    }
  });
});
