import { DynamoDBService } from '../../src/dal/dynamodb-service';
import { OrderService } from '../../src/services/order-service';
import { CustomerService } from '../../src/services/customer-service';
import { OrderStatus } from '../../src/models/models';

describe('OrderService Integration Tests', () => {
  const dynamo = new DynamoDBService();
  const orderService = new OrderService(dynamo);
  const createdOrderIds: string[] = [];
  const createdCustomerIds: string[] = [];
  let orderId: string | undefined;
  let customerId: string | undefined;

  it('should create an order', async () => {
    // create a customer to attach an order to
    const customerService = new CustomerService(dynamo);
    const customerRes = await customerService.createCustomer({
      customerId: `customer-${Date.now()}`,
      firstName: 'Order',
      lastName: 'Tester',
      email: `order.tester.${Date.now()}@example.com`,
      phone: '000',
      address: 'Nowhere',
    } as any);

    customerId = customerRes.customerId;
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
          totalPrice: 10,
        },
      ],
      totalAmount: 10,
      currency: 'EUR',
      shippingAddress: {
        line1: '123 Test St',
        city: 'Testville',
        country: 'GB',
        postalCode: '00000',
      },
      paymentMethod: { type: 'CREDIT_CARD', last4: '4242', brand: 'VISA' },
      orderDate: new Date().toISOString(),
      status: OrderStatus.PROCESSING,
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
    expect(fetched!.items.length).toBeGreaterThanOrEqual(1);
  });

  it('should get orders for customer', async () => {
    const orders = await orderService.getOrdersForCustomer(createdCustomerIds[0]!);
    expect(orders.length).toBeGreaterThanOrEqual(1);
  });

  it('should update order status', async () => {
    const updated = await orderService.updateOrderStatus(
      createdOrderIds[0]!,
      OrderStatus.DELIVERED
    );
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

    // Cleanup customers
    const customerService = new CustomerService(dynamo);
    for (const id of createdCustomerIds) {
      try {
        const c = await customerService.getCustomerById(id);
        if (c) {
          await customerService.deleteCustomer(id);
        }
      } catch (e) {
        // ignore
      }
    }
  });

  it('should create and delete a large order with many items (batch paths)', async () => {
    const customerService = new CustomerService(dynamo);
    const customerRes = await customerService.createCustomer({
      customerId: `customer-large-${Date.now()}`,
      firstName: 'Large',
      lastName: 'Order',
      email: `large.order.${Date.now()}@example.com`,
      phone: '000',
      address: 'Nowhere',
    } as any);

    const customerId2 = customerRes.customerId;

    const newOrderId = `order-large-${Date.now()}`;

    // build 30 items to exceed DynamoDB transact limits
    const items = Array.from({ length: 30 }).map((_, i) => ({
      productId: `p-${i}`,
      productName: `Product ${i}`,
      quantity: 1,
      unitPrice: 1,
      totalPrice: 1,
    }));

    const order = await orderService.createOrder({
      orderId: newOrderId,
      customerId: customerId2,
      items,
      totalAmount: 30,
      currency: 'USD',
      shippingAddress: {
        line1: '1 Bulk St',
        city: 'Bulkville',
        country: 'US',
        postalCode: '11111',
      },
      paymentMethod: { type: 'CREDIT_CARD', last4: '1111', brand: 'VISA' },
      orderDate: new Date().toISOString(),
      status: OrderStatus.PROCESSING,
    } as any);

    expect(order).toBeDefined();

    // verify it exists via getOrderById (GSI writes can be eventually consistent, so retry)

    // verify it exists via getOrderById (GSI writes can be eventually consistent, so retry)
    let fetched = null as any;
    const maxAttempts = 50;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      // eslint-disable-next-line no-await-in-loop
      fetched = await orderService.getOrderById(newOrderId);
      if (fetched && fetched.items && fetched.items.length === 30) break;
      // eslint-disable-next-line no-await-in-loop
      await new Promise((r) => setTimeout(r, 200));
    }

    expect(fetched).not.toBeNull();
    expect(fetched!.items.length).toEqual(30);

    // delete the large order
    await orderService.deleteOrder(newOrderId);

    const after = await orderService.getOrderById(newOrderId);
    expect(after).toBeNull();
  });
});
