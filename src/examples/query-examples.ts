import { DynamoDBService } from '../dal/dynamodb-service';
import { CustomerService } from '../services/customer-service';
import { OrderService } from '../services/order-service';
import { OrderStatus } from '../models/models';
import { CustomerCreateDto, CustomerUpdateDto, OrderCreateDto, CustomerDto } from '../models/dtos';

async function demoExamples(): Promise<void> {
  console.log('� Focused examples: Customer and Order flows using DTOs and services only\n');

  const dynamo = new DynamoDBService();
  const customerService = new CustomerService(dynamo);
  const orderService = new OrderService(dynamo);

  try {
    // Parse CLI flags: --customerId <id> and --orderId <id>
    const args = process.argv.slice(2);
    const argMap: Record<string, string> = {};
    for (let i = 0; i < args.length; i++) {
      const a = String(args[i] || '');
      if (a.startsWith('--')) {
        const key = a.replace(/^--/, '');
        const next = args[i + 1];
        const val = typeof next === 'string' && !next.startsWith('--') ? next : '';
        argMap[key] = val;
        if (val) i++;
      }
    }

    // support a simple help flag
    if (argMap.help !== undefined || argMap.h !== undefined) {
      console.log(
        '\nUsage: npm run demo:query -- [--customerId <id>] [--orderId <id>] [--status <STATUS>]'
      );
      console.log('\nOptions:');
      console.log('  --customerId   Use an existing customer id instead of creating one');
      console.log('  --orderId      Use an existing order id instead of creating one');
      console.log(
        '  --status       Order status to set (PENDING|CONFIRMED|PROCESSING|SHIPPED|DELIVERED|CANCELLED|REFUNDED)'
      );
      console.log('  --help, -h     Show this help');
      return;
    }

    // 1) Create Customer (or use provided customerId)
    console.log('1) Create Customer');
    const customerId = argMap.customerId ?? `customer-${Date.now()}`;
    const createDto: CustomerCreateDto = {
      customerId,
      email: `demo.${Date.now()}@example.com`,
      firstName: 'Demo',
      lastName: 'Customer',
      phone: '+1-555-0000',
      address: {
        home: {
          street: '100 Demo St',
          city: 'Demoville',
          state: 'CA',
          zipCode: '90000',
          country: 'USA',
        },
      },
    };

    let created: CustomerDto | null = null;
    if (argMap.customerId) {
      const existing = await customerService.getCustomerById(customerId);
      if (existing) {
        created = existing;
        console.log(`   ✅ Using existing customer ${existing.customerId}`);
      } else {
        created = await customerService.createCustomer(createDto);
        console.log(`   ✅ Created customer ${created.customerId}`);
      }
    } else {
      created = await customerService.createCustomer(createDto);
      console.log(`   ✅ Created customer ${created.customerId}`);
    }

    const createdCustomer = created as CustomerDto;

    // 2) Create, update and delete address for Customer
    console.log('\n2) Create, update and delete addresses for the customer');
    const addAddress: CustomerUpdateDto = {
      address: {
        ...(created.address ?? {}),
        work: {
          street: '200 Work Rd',
          city: 'Worktown',
          state: 'CA',
          zipCode: '90001',
          country: 'USA',
        },
      },
    };

    const afterAdd = await customerService.updateCustomer(createdCustomer.customerId, addAddress);
    console.log('   ✅ Added address keys:', Object.keys(afterAdd.address ?? {}));

    // remove work address
    const withoutWork = { ...(afterAdd.address ?? {}) } as Record<string, unknown>;
    delete withoutWork.work;
    const afterRemove = await customerService.updateCustomer(createdCustomer.customerId, {
      address: withoutWork,
    } as CustomerUpdateDto);
    console.log(
      '   ✅ Removed work address. Remaining keys:',
      Object.keys(afterRemove.address ?? {})
    );

    // 3) Place Order
    console.log('\n3) Place Order');
    const orderId = `order-${Date.now()}`;
    const orderCreate: OrderCreateDto = {
      orderId,
      customerId: createdCustomer.customerId,
      totalAmount: 100,
      currency: 'USD',
      items: [
        {
          productId: 'prod-demo-1',
          productName: 'Demo Product',
          quantity: 2,
          unitPrice: 50,
          totalPrice: 100,
        },
      ],
      shippingAddress: {
        street: createdCustomer.address?.home?.street ?? '',
        city: createdCustomer.address?.home?.city ?? '',
        state: createdCustomer.address?.home?.state ?? '',
        zipCode: createdCustomer.address?.home?.zipCode ?? '',
        country: createdCustomer.address?.home?.country ?? '',
      },
      paymentMethod: { type: 'CREDIT_CARD', last4: '4242', brand: 'Visa' },
      orderDate: new Date().toISOString(),
    };

    const placed = await orderService.createOrder(orderCreate);
    console.log(`   ✅ Placed order ${placed.orderId}`);

    // 4) Update Order
    console.log('\n4) Update Order (status)');
    // Allow overriding status via --status CLI flag (e.g. --status DELIVERED)
    const statusArg = (argMap.status || 'SHIPPED').toUpperCase();
    const statusMap: Record<string, OrderStatus> = {
      PENDING: OrderStatus.PENDING,
      CONFIRMED: OrderStatus.CONFIRMED,
      PROCESSING: OrderStatus.PROCESSING,
      SHIPPED: OrderStatus.SHIPPED,
      DELIVERED: OrderStatus.DELIVERED,
      CANCELLED: OrderStatus.CANCELLED,
      REFUNDED: OrderStatus.REFUNDED,
    };

    const chosenStatus = statusMap[statusArg] ?? OrderStatus.SHIPPED;
    await orderService.updateOrderStatus(placed.orderId, chosenStatus);
    const updated = await orderService.getOrderById(placed.orderId);
    console.log(`   ✅ Updated order status => ${updated?.status}`);

    // 5) View Customer and Most Recent Orders for Customer
    console.log('\n5) View Customer and Most Recent Orders');
    const customer = await customerService.getCustomerById(createdCustomer.customerId);
    const recent = await orderService.getOrdersForCustomer(createdCustomer.customerId, 5);
    console.log(
      `   ✅ Customer: ${customer?.customerId} - ${customer?.firstName} ${customer?.lastName}`
    );
    console.log(`   ✅ Recent orders: ${recent.map((r) => r.orderId).join(', ')}`);

    // 6) View Order and OrderItems
    console.log('\n6) View Order and OrderItems');
    const fetched = await orderService.getOrderById(placed.orderId);
    if (fetched) {
      console.log(`   ✅ Order ${fetched.orderId} has ${fetched.items.length} items:`);
      fetched.items.forEach((it) =>
        console.log(`      - ${it.productName} x${it.quantity} => ${it.totalPrice}`)
      );
    }

    console.log('\n🎉 Focused examples complete');
  } catch (err) {
    console.error('Error running examples:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  demoExamples().catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  });
}

export { demoExamples };
