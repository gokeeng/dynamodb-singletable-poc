import { v4 as uuidv4 } from 'uuid';
import { 
  UserStatus, 
  OrderStatus,
  ProductStatus,
  ProductEntity,
  ReviewEntity
} from '../models';
import { DynamoDBService } from '../dal';
import { OrderService, UserService } from '../services';

async function seedData(): Promise<void> {
  console.log('🌱 Starting data seeding...');

  const dynamoService = new DynamoDBService();
  const userService = new UserService(dynamoService);
  const orderService = new OrderService(dynamoService);

  try {
    // Create sample users
    console.log('👥 Creating users...');
    
    const user1 = await userService.createUser({
      UserId: uuidv4(),
      Email: 'john.doe@example.com',
      FirstName: 'John',
      LastName: 'Doe',
      DateOfBirth: '1990-01-15',
      Phone: '+1-555-0101',
      Address: {
        Street: '123 Main St',
        City: 'New York',
        State: 'NY',
        ZipCode: '10001',
        Country: 'USA'
      },
      Status: UserStatus.ACTIVE,
      Preferences: {
        NewsletterSubscribed: true,
        Theme: 'light',
        Language: 'en'
      }
    });
    console.log(`✅ Created user: ${user1.FirstName} ${user1.LastName}`);

    const user2 = await userService.createUser({
      UserId: uuidv4(),
      Email: 'jane.smith@example.com',
      FirstName: 'Jane',
      LastName: 'Smith',
      DateOfBirth: '1985-06-20',
      Phone: '+1-555-0102',
      Address: {
        Street: '456 Oak Ave',
        City: 'Los Angeles',
        State: 'CA',
        ZipCode: '90210',
        Country: 'USA'
      },
      Status: UserStatus.ACTIVE,
      Preferences: {
        NewsletterSubscribed: false,
        Theme: 'dark',
        Language: 'en'
      }
    });
    console.log(`✅ Created user: ${user2.FirstName} ${user2.LastName}`);

    // Create sample products
    console.log('📦 Creating products...');
    
    const product1 = ProductEntity.create({
      ProductId: uuidv4(),
      Name: 'Wireless Bluetooth Headphones',
      Description: 'High-quality wireless headphones with noise cancellation',
      Category: 'Electronics',
      Brand: 'AudioTech',
      Price: 199.99,
      Currency: 'USD',
      SKU: 'AT-WBH-001',
      Stock: 50,
      Images: ['https://example.com/headphones1.jpg'],
      Attributes: [
        { Name: 'Color', Value: 'Black', Type: 'COLOR' },
        { Name: 'Battery Life', Value: '30 hours', Type: 'TEXT' },
        { Name: 'Wireless', Value: 'true', Type: 'BOOLEAN' }
      ],
      Status: ProductStatus.ACTIVE,
      AverageRating: 4.5,
      ReviewCount: 128,
      Tags: ['wireless', 'bluetooth', 'headphones', 'noise-cancelling']
    });
    await dynamoService.putItem(product1);
    console.log(`✅ Created product: ${product1.Name}`);

    const product2 = ProductEntity.create({
      ProductId: uuidv4(),
      Name: 'Organic Cotton T-Shirt',
      Description: 'Comfortable organic cotton t-shirt in various colors',
      Category: 'Clothing',
      Brand: 'EcoWear',
      Price: 29.99,
      Currency: 'USD',
      SKU: 'EW-OCT-001',
      Stock: 100,
      Images: ['https://example.com/tshirt1.jpg'],
      Attributes: [
        { Name: 'Material', Value: 'Organic Cotton', Type: 'TEXT' },
        { Name: 'Size', Value: 'Medium', Type: 'SIZE' },
        { Name: 'Color', Value: 'Blue', Type: 'COLOR' }
      ],
      Status: ProductStatus.ACTIVE,
      AverageRating: 4.2,
      ReviewCount: 64,
      Tags: ['organic', 'cotton', 'clothing', 'eco-friendly']
    });
    await dynamoService.putItem(product2);
    console.log(`✅ Created product: ${product2.Name}`);

    // Create sample orders
    console.log('🛒 Creating orders...');
    
    const order1 = await orderService.createOrder({
      OrderId: uuidv4(),
      UserId: user1.UserId,
      Status: OrderStatus.DELIVERED,
      TotalAmount: 229.98,
      Currency: 'USD',
      Items: [
        {
          ProductId: product1.ProductId,
          ProductName: product1.Name,
          Quantity: 1,
          UnitPrice: 199.99,
          TotalPrice: 199.99
        },
        {
          ProductId: product2.ProductId,
          ProductName: product2.Name,
          Quantity: 1,
          UnitPrice: 29.99,
          TotalPrice: 29.99
        }
      ],
      ShippingAddress: {
        FirstName: user1.FirstName,
        LastName: user1.LastName,
        Street: user1.Address!.Street,
        City: user1.Address!.City,
        State: user1.Address!.State,
        ZipCode: user1.Address!.ZipCode,
        Country: user1.Address!.Country
      },
      PaymentMethod: {
        Type: 'CREDIT_CARD',
        Last4: '1234',
        Brand: 'Visa'
      },
      OrderDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
      ShippedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
      DeliveredDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
      TrackingNumber: 'TRK123456789'
    });
    console.log(`✅ Created order: ${order1.OrderId}`);

    const order2 = await orderService.createOrder({
      OrderId: uuidv4(),
      UserId: user2.UserId,
      Status: OrderStatus.PROCESSING,
      TotalAmount: 399.98,
      Currency: 'USD',
      Items: [
        {
          ProductId: product1.ProductId,
          ProductName: product1.Name,
          Quantity: 2,
          UnitPrice: 199.99,
          TotalPrice: 399.98
        }
      ],
      ShippingAddress: {
        FirstName: user2.FirstName,
        LastName: user2.LastName,
        Street: user2.Address!.Street,
        City: user2.Address!.City,
        State: user2.Address!.State,
        ZipCode: user2.Address!.ZipCode,
        Country: user2.Address!.Country
      },
      PaymentMethod: {
        Type: 'PAYPAL'
      },
      OrderDate: new Date().toISOString()
    });
    console.log(`✅ Created order: ${order2.OrderId}`);

    // Create sample reviews
    console.log('⭐ Creating reviews...');
    
    const review1 = ReviewEntity.create({
      ReviewId: uuidv4(),
      ProductId: product1.ProductId,
      UserId: user1.UserId,
      Rating: 5,
      Title: 'Excellent sound quality!',
      Content: 'These headphones are amazing. The sound quality is crystal clear and the noise cancellation works perfectly. Highly recommended!',
      Verified: true,
      HelpfulCount: 12,
      Images: ['https://example.com/review1.jpg']
    });
    await dynamoService.putItem(review1);
    console.log(`✅ Created review: ${review1.Title}`);

    const review2 = ReviewEntity.create({
      ReviewId: uuidv4(),
      ProductId: product2.ProductId,
      UserId: user2.UserId,
      Rating: 4,
      Title: 'Comfortable and eco-friendly',
      Content: 'Great quality t-shirt. The organic cotton feels really soft and comfortable. Good value for money.',
      Verified: true,
      HelpfulCount: 8
    });
    await dynamoService.putItem(review2);
    console.log(`✅ Created review: ${review2.Title}`);

    console.log('🎉 Data seeding completed successfully!');
    console.log(`
📊 Summary:
- Users created: 2
- Products created: 2  
- Orders created: 2
- Reviews created: 2

🚀 You can now run the query examples to see the data in action!
    `);

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