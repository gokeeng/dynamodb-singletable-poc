import { DynamoDBService } from '../dal/dynamodb-service';
import { OrderStatus } from '../models/order';
import { OrderService } from '../services/order-service';

async function demonstrateQueries(): Promise<void> {
  console.log('🔍 Demonstrating DynamoDB Single Table Query Patterns...\n');

  const dynamoService = new DynamoDBService();
  const orderService = new OrderService(dynamoService);

  try {
    // 1. Get customer by email (GSI1 query)
    console.log('1️⃣ Query examples (name-search demo removed)');
    console.log();

    // 2. Get customer's orders (GSI1 query)
    // This example previously demonstrated fetching orders for a found customer. Replace with
    // a getCustomerById + orderService.getOrdersByCustomer(customerId) call in your code.
    console.log();

    // 3. Get orders by status (GSI2 query)
    console.log('3️⃣ Query: Get orders by status');
    console.log('   Pattern: GSI2 query (ORDER#STATUS#PROCESSING -> date)');
    const processingOrders = await orderService.getOrdersByStatus(OrderStatus.PROCESSING);
    console.log(`   ✅ Found ${processingOrders.length} processing orders`);
    processingOrders.forEach((order, index) => {
      console.log(
        `   🔄 Order ${index + 1}: ${order.orderId} - $${order.totalAmount} - ${order.orderDate}`
      );
    });
    console.log();

    // 4. Get customer order statistics
    // This example previously aggregated stats for a discovered customer. Replace with
    // a lookup + orderService.getCustomerOrderStats(customerId) call in your code.
    console.log();

    // 5. Demonstrate products by querying GSI1 by category
    console.log('5️⃣ Query: Products by category using GSI1');
    console.log('   Pattern: GSI1 query (Product#CATEGORY#Electronics)');
    const allProducts = await dynamoService.queryGSI1('Product#CATEGORY#Electronics', undefined, {
      limit: 10,
    });
    console.log(`   ✅ Found ${allProducts.items.length} products`);
    allProducts.items.forEach((item: unknown, index) => {
      const p = item as Record<string, unknown>;
      const name = String(p['name'] ?? '');
      const price = Number(p['price'] ?? 0);
      const category = String(p['category'] ?? '');
      console.log(`   🛍️  Product ${index + 1}: ${name} - $${price} (${category})`);
    });
    console.log();

    // 6. Demonstrate GSI2 product queries by category
    console.log('6️⃣ Query: Products by category');
    console.log('   Pattern: GSI1 query (Product#CATEGORY#Electronics)');
    const electronicsProducts = await dynamoService.queryGSI1('Product#CATEGORY#Electronics');
    console.log(`   ✅ Found ${electronicsProducts.items.length} electronics products`);
    electronicsProducts.items.forEach((item: unknown, index) => {
      const p = item as Record<string, unknown>;
      const name = String(p['name'] ?? '');
      const brand = String(p['brand'] ?? '');
      const price = Number(p['price'] ?? 0);
      console.log(`   💻 Product ${index + 1}: ${name} - ${brand} - $${price}`);
    });
    console.log();

    // 7. Recent orders across all customers
    console.log('7️⃣ Query: Recent delivered orders');
    console.log('   Pattern: GSI2 query with date filter');
    const recentDeliveredOrders = await orderService.getRecentOrdersByStatus(
      OrderStatus.DELIVERED,
      30
    );
    console.log(`   ✅ Found ${recentDeliveredOrders.length} orders delivered in last 30 days`);
    recentDeliveredOrders.forEach((order, index) => {
      console.log(
        `   📦 Order ${index + 1}: ${order.orderId} - $${order.totalAmount} - ${
          order.deliveredDate
        }`
      );
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
1. Customer lookup by name (GSI1)
2. Customer's order history (GSI1) 
3. Orders by status (GSI2)
4. Products by category (GSI1)
5. Aggregated customer statistics
6. Time-based queries with filters
7. Entity type scans
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
