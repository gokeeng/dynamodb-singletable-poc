import { v4 as uuidv4 } from 'uuid';
import { OrderStatus, ProductStatus, ProductEntity } from '../models/models';
import { DynamoDBService } from '../dal/dynamodb-service';
import { OrderService } from '../services/order-service';
import { CustomerService } from '../services/customer-service';

async function seedData(): Promise<void> {
  console.log('🌱 Starting data seeding...');

  const dynamoService = new DynamoDBService();
  const customerService = new CustomerService(dynamoService);
  const orderService = new OrderService(dynamoService);

  try {
    // Create sample customers
    console.log('👥 Creating customers...');

    const customer1 = await customerService.createCustomer({
      customerId: uuidv4(),
      email: 'john.doe@example.com',
      firstName: 'John',
      lastName: 'Doe',
      phone: '+1-555-0101',
      address: {
        home: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'USA',
        },
      },
    });
    console.log(`✅ Created customer: ${customer1.firstName} ${customer1.lastName}`);

    const customer2 = await customerService.createCustomer({
      customerId: uuidv4(),
      email: 'jane.smith@example.com',
      firstName: 'Jane',
      lastName: 'Smith',
      phone: '+1-555-0102',
      address: {
        home: {
          street: '456 Oak Ave',
          city: 'Los Angeles',
          state: 'CA',
          zipCode: '90210',
          country: 'USA',
        },
      },
    });
    console.log(`✅ Created customer: ${customer2.firstName} ${customer2.lastName}`);

    // Create sample products
    console.log('📦 Creating products...');

    const product1 = ProductEntity.create({
      productId: uuidv4(),
      name: 'Wireless Bluetooth Headphones',
      description: 'High-quality wireless headphones with noise cancellation',
      category: 'Electronics',
      brand: 'AudioTech',
      price: 199.99,
      currency: 'USD',
      sku: 'AT-WBH-001',
      stock: 50,
      images: ['https://example.com/headphones1.jpg'],
      attributes: [
        { name: 'Battery Life', value: '30 hours', type: 'TEXT' },
        { name: 'Wireless', value: 'true', type: 'BOOLEAN' },
      ],
      status: ProductStatus.ACTIVE,
      averageRating: 4.5,
      reviewCount: 128,
      tags: ['wireless', 'bluetooth', 'headphones', 'noise-cancelling'],
    });
    await dynamoService.putItem(product1);
    console.log(`✅ Created product: ${product1.name}`);

    const product2 = ProductEntity.create({
      productId: uuidv4(),
      name: 'Organic Cotton T-Shirt',
      description: 'Comfortable organic cotton t-shirt in various colors',
      category: 'Clothing',
      brand: 'EcoWear',
      price: 29.99,
      currency: 'USD',
      sku: 'EW-OCT-001',
      stock: 100,
      images: ['https://example.com/tshirt1.jpg'],
      attributes: [
        { name: 'Material', value: 'Organic Cotton', type: 'TEXT' },
        { name: 'Size', value: 'Medium', type: 'SIZE' },
        { name: 'Color', value: 'Blue', type: 'COLOR' },
      ],
      status: ProductStatus.ACTIVE,
      averageRating: 4.2,
      reviewCount: 64,
      tags: ['organic', 'cotton', 'clothing', 'eco-friendly'],
    });
    await dynamoService.putItem(product2);
    console.log(`✅ Created product: ${product2.name}`);

    // Create sample orders
    console.log('🛒 Creating orders...');

    const order1 = await orderService.createOrder({
      orderId: uuidv4(),
      customerId: customer1.customerId,
      totalAmount: 229.98,
      currency: 'USD',
      items: [
        {
          productId: product1.productId,
          productName: product1.name,
          quantity: 1,
          unitPrice: 199.99,
          totalPrice: 199.99,
        },
        {
          productId: product2.productId,
          productName: product2.name,
          quantity: 1,
          unitPrice: 29.99,
          totalPrice: 29.99,
        },
      ],
      shippingAddress: {
        street: customer1.address?.home?.street ?? '',
        city: customer1.address?.home?.city ?? '',
        state: customer1.address?.home?.state ?? '',
        zipCode: customer1.address?.home?.zipCode ?? '',
        country: customer1.address?.home?.country ?? '',
      },
      paymentMethod: {
        type: 'CREDIT_CARD',
        last4: '1234',
        brand: 'Visa',
      },
      orderDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
    });
    console.log(`✅ Created order: ${order1.orderId}`);

    // Mark the first order as delivered so timestamps are populated via updateOrderStatus
    await orderService.updateOrderStatus(order1.orderId, OrderStatus.DELIVERED);

    const order2 = await orderService.createOrder({
      orderId: uuidv4(),
      customerId: customer2.customerId,
      totalAmount: 399.98,
      currency: 'USD',
      items: [
        {
          productId: product1.productId,
          productName: product1.name,
          quantity: 2,
          unitPrice: 199.99,
          totalPrice: 399.98,
        },
      ],
      shippingAddress: {
        street: customer2.address?.home?.street ?? '',
        city: customer2.address?.home?.city ?? '',
        state: customer2.address?.home?.state ?? '',
        zipCode: customer2.address?.home?.zipCode ?? '',
        country: customer2.address?.home?.country ?? '',
      },
      paymentMethod: {
        type: 'PAYPAL',
      },
      orderDate: new Date().toISOString(),
    });
    console.log(`✅ Created order: ${order2.orderId}`);

    console.log('🎉 Data seeding completed successfully!');
    console.log(
      `\n- Customers created: 2\n- Products created: 2\n- Orders created: 2\n\n🚀 You can now run the query examples to see the data in action!\n`
    );
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
}

// Run the seeding if this file is executed directly
if (require.main === module) {
  seedData().catch(console.error);
}

export { seedData };
