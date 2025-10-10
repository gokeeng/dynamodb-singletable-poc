
import { DynamoDBService } from '../dal';
import { OrderStatus } from '../models';
import { OrderService, UserService } from '../services';

async function demonstrateQueries(): Promise<void> {
  console.log('🔍 Demonstrating DynamoDB Single Table Query Patterns...\n');

  const dynamoService = new DynamoDBService();
  const userService = new UserService(dynamoService);
  const orderService = new OrderService(dynamoService);

  try {
    // 1. Get user by email (GSI1 query)
    console.log('1️⃣ Query: Get user by email');
    console.log('   Pattern: GSI1 query (USER#EMAIL -> email)');
    const userByEmail = await userService.getUserByEmail('john.doe@example.com');
    if (userByEmail) {
      console.log(`   ✅ Found user: ${userByEmail.FirstName} ${userByEmail.LastName}`);
      console.log(`   📧 Email: ${userByEmail.Email}`);
    } else {
      console.log('   ❌ User not found');
    }
    console.log();

    // 2. Get user's orders (GSI1 query)
    console.log('2️⃣ Query: Get user\'s order history');
    console.log('   Pattern: GSI1 query (USER#userId -> ORDER#)');
    if (userByEmail) {
      const userOrders = await orderService.getOrdersByUser(userByEmail.UserId);
      console.log(`   ✅ Found ${userOrders.length} orders for ${userByEmail.FirstName}`);
      userOrders.forEach((order, index) => {
        console.log(`   📦 Order ${index + 1}: ${order.OrderId} - ${order.Status} - $${order.TotalAmount}`);
      });
    }
    console.log();

    // 3. Get orders by status (GSI2 query)
    console.log('3️⃣ Query: Get orders by status');
    console.log('   Pattern: GSI2 query (ORDER#STATUS#PROCESSING -> date)');
    const processingOrders = await orderService.getOrdersByStatus(OrderStatus.PROCESSING);
    console.log(`   ✅ Found ${processingOrders.length} processing orders`);
    processingOrders.forEach((order, index) => {
      console.log(`   🔄 Order ${index + 1}: ${order.OrderId} - $${order.TotalAmount} - ${order.OrderDate}`);
    });
    console.log();

    // 4. Get user order statistics
    console.log('4️⃣ Query: User order statistics');
    console.log('   Pattern: Multiple queries aggregated');
    if (userByEmail) {
      const stats = await orderService.getUserOrderStats(userByEmail.UserId);
      console.log(`   📊 Statistics for ${userByEmail.FirstName}:`);
      console.log(`      Total Orders: ${stats.totalOrders}`);
      console.log(`      Total Spent: $${stats.totalSpent.toFixed(2)}`);
      console.log(`      Orders by Status:`);
      Object.entries(stats.ordersByStatus).forEach(([status, count]) => {
        if (count > 0) {
          console.log(`        ${status}: ${count}`);
        }
      });
    }
    console.log();

    // 5. Demonstrate products by querying GSI1 by category
    console.log('5️⃣ Query: Products by category using GSI1');
    console.log('   Pattern: GSI1 query (PRODUCT#CATEGORY#Electronics)');
    const allProducts = await dynamoService.queryGSI1(
      'PRODUCT#CATEGORY#Electronics',
      undefined,
      { limit: 10 }
    );
    console.log(`   ✅ Found ${allProducts.items.length} products`);
    allProducts.items.forEach((item: any, index) => {
      console.log(`   🛍️  Product ${index + 1}: ${item.Name} - $${item.Price} (${item.Category})`);
    });
    console.log();

    // 6. Demonstrate GSI2 product queries by category
    console.log('6️⃣ Query: Products by category');
    console.log('   Pattern: GSI1 query (PRODUCT#CATEGORY#Electronics)');
    const electronicsProducts = await dynamoService.queryGSI1(
      'PRODUCT#CATEGORY#Electronics'
    );
    console.log(`   ✅ Found ${electronicsProducts.items.length} electronics products`);
    electronicsProducts.items.forEach((item: any, index) => {
      console.log(`   💻 Product ${index + 1}: ${item.Name} - ${item.Brand} - $${item.Price}`);
    });
    console.log();

    // 7. Demonstrate reviews by product (GSI2)
    console.log('7️⃣ Query: Reviews for a product');
    console.log('   Pattern: GSI2 query (PRODUCT#productId -> REVIEW#)');
    if (electronicsProducts.items.length > 0) {
      const product = electronicsProducts.items[0] as any;
      const productReviews = await dynamoService.queryGSI2(
        `PRODUCT#${product.ProductId}`,
        'REVIEW#'
      );
      console.log(`   ✅ Found ${productReviews.items.length} reviews for ${product.Name}`);
      productReviews.items.forEach((review: any, index) => {
        console.log(`   ⭐ Review ${index + 1}: ${review.Rating}/5 - "${review.Title}"`);
      });
    }
    console.log();

    // 8. Recent orders across all users
    console.log('8️⃣ Query: Recent delivered orders');
    console.log('   Pattern: GSI2 query with date filter');
    const recentDeliveredOrders = await orderService.getRecentOrdersByStatus(OrderStatus.DELIVERED, 30);
    console.log(`   ✅ Found ${recentDeliveredOrders.length} orders delivered in last 30 days`);
    recentDeliveredOrders.forEach((order, index) => {
      console.log(`   📦 Order ${index + 1}: ${order.OrderId} - $${order.TotalAmount} - ${order.DeliveredDate}`);
    });

    console.log('\n🎉 Query demonstration completed!');
    console.log(`
🏗️  Single Table Design Benefits Demonstrated:
✅ Fast queries using partition keys and sort keys
✅ Efficient GSI usage for different access patterns  
✅ Denormalized data reduces the need for joins
✅ Consistent performance regardless of data volume
✅ Cost-effective with predictable capacity planning

🔗 Access Patterns Covered:
1. User lookup by email (GSI1)
2. User's order history (GSI1) 
3. Orders by status (GSI2)
4. Products by category (GSI1)
5. Reviews by product (GSI2)
6. Aggregated user statistics
7. Time-based queries with filters
8. Entity type scans
    `);

  } catch (error) {
    console.error('❌ Error demonstrating queries:', error);
    process.exit(1);
  }
}

// Run the demonstration if this file is executed directly
if (require.main === module) {
  demonstrateQueries().catch(console.error);
}

export { demonstrateQueries };