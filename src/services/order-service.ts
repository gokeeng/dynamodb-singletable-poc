import { DynamoDBService } from '../dal/dynamodb-service';
import { Order, OrderEntity, OrderStatus, KeyBuilder } from '../models';

export class OrderService {
  constructor(private dynamoService: DynamoDBService) {}

  /**
   * Create a new order
   */
  async createOrder(orderData: Omit<Order, keyof import('../models').BaseEntity>): Promise<Order> {
    const order = OrderEntity.create(orderData);
    return await this.dynamoService.putItem(order);
  }

  /**
   * Get order by ID
   */
  async getOrderById(orderId: string): Promise<Order | null> {
    const pk = KeyBuilder.orderPK(orderId);
    const sk = KeyBuilder.orderSK();
    return await this.dynamoService.getItem<Order>(pk, sk);
  }

  /**
   * Get orders by user using GSI1
   */
  async getOrdersByUser(userId: string, limit?: number): Promise<Order[]> {
    const gsi1Keys = KeyBuilder.ordersByUserGSI1(userId);
    const result = await this.dynamoService.queryGSI1<Order>(
      gsi1Keys.gsi1pk,
      gsi1Keys.gsi1sk,
      { 
        limit,
        scanIndexForward: false // Most recent orders first
      }
    );
    
    return result.items;
  }

  /**
   * Get orders by status using GSI2
   */
  async getOrdersByStatus(status: OrderStatus, limit?: number): Promise<Order[]> {
    const gsi2pk = `ORDER#STATUS#${status}`;
    const result = await this.dynamoService.queryGSI2<Order>(
      gsi2pk,
      undefined,
      { 
        limit,
        scanIndexForward: false // Most recent orders first
      }
    );
    
    return result.items;
  }

  /**
   * Update order status
   */
  async updateOrderStatus(orderId: string, newStatus: OrderStatus): Promise<Order> {
    const currentOrder = await this.getOrderById(orderId);
    if (!currentOrder) {
      throw new Error(`Order ${orderId} not found`);
    }

    const updatedOrder = OrderEntity.updateStatus(currentOrder, newStatus);
    
    // Update the order in the database
    await this.dynamoService.putItem(updatedOrder);
    return updatedOrder;
  }

  /**
   * Add tracking number to order
   */
  async addTrackingNumber(orderId: string, trackingNumber: string): Promise<Order> {
    const currentOrder = await this.getOrderById(orderId);
    if (!currentOrder) {
      throw new Error(`Order ${orderId} not found`);
    }

    const updatedOrder = OrderEntity.addTrackingNumber(currentOrder, trackingNumber);
    
    await this.dynamoService.putItem(updatedOrder);
    return updatedOrder;
  }

  /**
   * Get recent orders (last 30 days) by status
   */
  async getRecentOrdersByStatus(status: OrderStatus, days: number = 30): Promise<Order[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const cutoffISO = cutoffDate.toISOString();

    const gsi2pk = `ORDER#STATUS#${status}`;
    const result = await this.dynamoService.queryGSI2<Order>(
      gsi2pk,
      undefined,
      {
        filterExpression: 'orderDate >= :cutoffDate',
        expressionAttributeValues: {
          ':cutoffDate': cutoffISO
        },
        scanIndexForward: false
      }
    );
    
    return result.items;
  }

  /**
   * Get orders within a date range for a user
   */
  async getUserOrdersByDateRange(
    userId: string, 
    startDate: string, 
    endDate: string
  ): Promise<Order[]> {
    const gsi1Keys = KeyBuilder.ordersByUserGSI1(userId);
    const result = await this.dynamoService.queryGSI1<Order>(
      gsi1Keys.gsi1pk,
      gsi1Keys.gsi1sk,
      {
        filterExpression: 'orderDate BETWEEN :startDate AND :endDate',
        expressionAttributeValues: {
          ':startDate': startDate,
          ':endDate': endDate
        },
        scanIndexForward: false
      }
    );
    
    return result.items;
  }

  /**
   * Delete order
   */
  async deleteOrder(orderId: string): Promise<void> {
    const pk = KeyBuilder.orderPK(orderId);
    const sk = KeyBuilder.orderSK();
    await this.dynamoService.deleteItem(pk, sk);
  }

  /**
   * Get order statistics by user
   */
  async getUserOrderStats(userId: string): Promise<{
    totalOrders: number;
    totalSpent: number;
    ordersByStatus: Record<OrderStatus, number>;
  }> {
    const orders = await this.getOrdersByUser(userId);
    
    const stats = {
      totalOrders: orders.length,
      totalSpent: orders.reduce((total, order) => total + order.totalAmount, 0),
      ordersByStatus: {} as Record<OrderStatus, number>
    };

    // Initialize status counts
    Object.values(OrderStatus).forEach(status => {
      stats.ordersByStatus[status] = 0;
    });

    // Count orders by status
    orders.forEach(order => {
      stats.ordersByStatus[order.status]++;
    });

    return stats;
  }
}