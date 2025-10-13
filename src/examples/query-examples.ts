import { DynamoDBService } from '../dal/dynamodb-service';
import { OrderStatus } from '../models/order';
import { OrderService } from '../services/order-service';
import { CustomerService } from '../services/customer-service';

async function demonstrateQueries(): Promise<void> {
  console.log('🔍 Demonstrating DynamoDB Single Table Query Patterns...\n');

  const dynamoService = new DynamoDBService();
  const customerService = new CustomerService(dynamoService);
  const orderService = new OrderService(dynamoService);

  try {
    // 1. Get customer by email (GSI1 query)
    console.log('1️⃣ Query: Get customer by email');
    console.log('   Pattern: GSI1 query (CUSTOMER#EMAIL -> email)');
    const customerByEmail = await customerService.getCustomerByEmail('john.doe@example.com');
    if (customerByEmail) {
      console.log(`   ✅ Found customer: ${customerByEmail.firstName} ${customerByEmail.lastName}`);
      console.log(`   📧 Email: ${customerByEmail.email}`);
    } else {
      console.log('   ❌ Customer not found');
    }
    console.log();

    // 2. Get customer's orders (GSI1 query)
    console.log('2️⃣ Query: Get customer\'s order history');
  console.log('   Pattern: GSI1 query (CUSTOMER#customerId -> ORDER#)');
    if (customerByEmail) {
        const customerOrders = await orderService.getOrdersByCustomer(customerByEmail!.customerId);
      console.log(`   ✅ Found ${customerOrders.length} orders for ${customerByEmail.firstName}`);
      customerOrders.forEach((order, index) => {
        console.log(`   📦 Order ${index + 1}: ${order.orderId} - ${order.status} - $${order.totalAmount}`);
      });
    }
    console.log();

    // 3. Get orders by status (GSI2 query)
    console.log('3️⃣ Query: Get orders by status');
    console.log('   Pattern: GSI2 query (ORDER#STATUS#PROCESSING -> date)');
    const processingOrders = await orderService.getOrdersByStatus(OrderStatus.PROCESSING);
    console.log(`   ✅ Found ${processingOrders.length} processing orders`);
    processingOrders.forEach((order, index) => {
      console.log(`   🔄 Order ${index + 1}: ${order.orderId} - $${order.totalAmount} - ${order.orderDate}`);
    });
    console.log();

    // 4. Get customer order statistics
    console.log('4️⃣ Query: Customer order statistics');
    console.log('   Pattern: Multiple queries aggregated');
    if (customerByEmail) {
    const stats = await orderService.getCustomerOrderStats(customerByEmail.customerId);
      console.log(`   📊 Statistics for ${customerByEmail.firstName}:`);
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
    console.log('   Pattern: GSI1 query (Product#CATEGORY#Electronics)');
    const allProducts = await dynamoService.queryGSI1(
      'Product#CATEGORY#Electronics',
      undefined,
      { limit: 10 }
    );
    console.log(`   ✅ Found ${allProducts.items.length} products`);
    allProducts.items.forEach((item: any, index) => {
      console.log(`   🛍️  Product ${index + 1}: ${item.name} - $${item.price} (${item.category})`);
    });
    console.log();

    // 6. Demonstrate GSI2 product queries by category
    console.log('6️⃣ Query: Products by category');
    console.log('   Pattern: GSI1 query (Product#CATEGORY#Electronics)');
    const electronicsProducts = await dynamoService.queryGSI1(
      'Product#CATEGORY#Electronics'
    );
    console.log(`   ✅ Found ${electronicsProducts.items.length} electronics products`);
    electronicsProducts.items.forEach((item: any, index) => {
      console.log(`   💻 Product ${index + 1}: ${item.name} - ${item.brand} - $${item.price}`);
    });
    console.log();

    // 7. Recent orders across all customers
    console.log('7️⃣ Query: Recent delivered orders');
    console.log('   Pattern: GSI2 query with date filter');
    const recentDeliveredOrders = await orderService.getRecentOrdersByStatus(OrderStatus.DELIVERED, 30);
    console.log(`   ✅ Found ${recentDeliveredOrders.length} orders delivered in last 30 days`);
    recentDeliveredOrders.forEach((order, index) => {
      console.log(`   📦 Order ${index + 1}: ${order.orderId} - $${order.totalAmount} - ${order.deliveredDate}`);
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
1. Customer lookup by email (GSI1)
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