import { DynamoDBService } from '../dal/dynamodb-service';
import {
  Order,
  OrderEntity,
  OrderStatus,
  PaymentMethod,
  OrderItem,
  OrderItemEntity,
  BaseEntity,
  EntityTypes,
} from '../models/models';
import { OrderCreateDto, OrderDto } from '../models/dtos';
import { toOrderDto } from '../models/mappers';
import { KeyBuilder } from '../dal/key-builder';

export class OrderService {
  constructor(private dynamoService: DynamoDBService) {}

  /**
   * Create a new order
   */
  async createOrder(orderData: OrderCreateDto): Promise<OrderDto> {
    const persistenceOrder: Omit<Order, keyof BaseEntity> = {
      orderId: orderData.orderId,
      customerId: orderData.customerId,
      status: OrderStatus.PENDING,
      totalAmount: orderData.totalAmount,
      currency: orderData.currency,
      shippingAddress: orderData.shippingAddress,
      paymentMethod: orderData.paymentMethod as PaymentMethod,
      orderDate: orderData.orderDate,
    };

    const order = OrderEntity.create(persistenceOrder);

    const persistenceOrderItems: Omit<OrderItem, keyof BaseEntity>[] = orderData.items.map(
      (item) => ({
        orderId: orderData.orderId,
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
      })
    );

    const orderItems = persistenceOrderItems.map((item) => OrderItemEntity.create(item));

    await this.putOrderWithItems(order, orderItems);

    return toOrderDto(order, orderItems);
  }

  private async putOrderWithItems(order: Order, orderItems: OrderItem[]): Promise<void> {
    // DynamoDB transactions and batch limits:
    // - TransactWrite supports up to 25 items.
    // If total entries (order + items) fit within 25, use a single transaction for atomicity.
    // Otherwise fall back to: conditionally put the order, then batchWrite the items.
    const totalEntries = 1 + orderItems.length;

    if (totalEntries <= 25) {
      type PutEntry = {
        Put: {
          Item: BaseEntity;
          ConditionExpression?: string;
          ExpressionAttributeValues?: Record<string, unknown>;
          ExpressionAttributeNames?: Record<string, string>;
        };
      };

      const transactEntries: PutEntry[] = [
        // put order with conditional guard
        {
          Put: {
            Item: order,
            // ensure we don't overwrite existing order
            ConditionExpression: 'attribute_not_exists(pk) AND attribute_not_exists(sk)',
          },
        },
        ...orderItems.map((it) => ({ Put: { Item: it } })),
      ];

      return await this.dynamoService.transactWriteItems(transactEntries);
    }

    // For larger orders (more than 24 items), we cannot perform a single transact write.
    // Strategy:
    // 1) Conditionally put the order (transactPutItems with condition)
    // 2) Batch write order items in chunks of 25 (batchWrite handles chunking)
    // 3) If batchWrite fails attempt to delete the order to rollback.
    await this.dynamoService.transactPutItems([
      { Item: order, ConditionExpression: 'attribute_not_exists(pk) AND attribute_not_exists(sk)' },
    ]);

    try {
      // batchWrite still expects BaseEntity[]; orderItems are compatible
      await this.dynamoService.batchWrite(orderItems, []);
    } catch (err) {
      // Attempt best-effort cleanup of any items that may have been written.
      try {
        const chunks: Array<typeof orderItems> = [];
        const batchSize = 25;
        for (let i = 0; i < orderItems.length; i += batchSize) {
          chunks.push(orderItems.slice(i, i + batchSize));
        }

        for (const chunk of chunks) {
          const deleteKeys = chunk.map((it) => ({ pk: it.pk, sk: it.sk }));
          // Best-effort: delete any items from this chunk
          // eslint-disable-next-line no-await-in-loop
          await this.dynamoService.batchWrite([], deleteKeys);
        }

        // also remove the order record
        try {
          await this.dynamoService.deleteItem(order.pk, order.sk);
        } catch (e) {
          // swallow
        }
      } catch (cleanupErr) {
        // swallow cleanup errors but log to console for operators
        // eslint-disable-next-line no-console
        console.error('Error during createOrder cleanup:', cleanupErr);
      }

      throw err;
    }
  }

  /**
   * Get order by ID
   */
  // internal helper: return persistence-shaped order + items
  private async getOrderByIdData(
    orderId: string
  ): Promise<{ order: Order; items: OrderItem[] } | null> {
    const gsi1Keys = KeyBuilder.ordersGSI1(orderId);
    // query GSI1 using the order-scoped GSI partition key only. Do NOT pass a gsi1sk
    // because order items use a different gsi1sk prefix (Item#...) and we want both
    // the order record and item records returned by the query.
    const result = await this.dynamoService.queryGSI1<BaseEntity>(gsi1Keys.gsi1pk);

    if (!result.items || result.items.length === 0) return null;

    const order = result.items.find((it) => it.entityType === EntityTypes.ORDER) as
      | Order
      | undefined;
    const items =
      (result.items.filter((it) => it.entityType === EntityTypes.ORDER_ITEM) as
        | OrderItem[]
        | undefined) || [];

    if (!order) return null;
    return { order, items };
  }

  /**
   * Get order by ID
   */
  async getOrderById(orderId: string): Promise<OrderDto | null> {
    const fetched = await this.getOrderByIdData(orderId);
    if (!fetched) return null;
    return toOrderDto(fetched.order, fetched.items);
  }

  /**
   * Get orders by user using GSI1
   */
  async getOrdersForCustomer(customerId: string, limit?: number): Promise<OrderDto[]> {
    const pk = KeyBuilder.customerPK(customerId);

    const { skCondition, skValue } = KeyBuilder.ordersSKKeyCondition();

    const result = await this.dynamoService.queryByPKAndSK<Order>(pk, skCondition, skValue, {
      limit,
      scanIndexForward: false, // Most recent orders first
    });

    return result.items.map((o) => toOrderDto(o as Order, []));
  }

  /**
   * Update order status
   */
  async updateOrderStatus(orderId: string, newStatus: OrderStatus): Promise<OrderDto> {
    const fetched = await this.getOrderByIdData(orderId);
    if (!fetched) {
      throw new Error(`Order ${orderId} not found`);
    }

    const currentOrder = fetched.order;
    const updatedOrder = OrderEntity.updateStatus(currentOrder, newStatus);

    // Update the order in the database (keep items as-is)
    await this.dynamoService.putItem(updatedOrder);
    return toOrderDto(updatedOrder, fetched.items);
  }

  /**
   * Delete order
   */
  async deleteOrder(orderId: string): Promise<void> {
    // Fetch the persistence-shaped order and its items (via GSI1)
    const fetched = await this.getOrderByIdData(orderId);
    if (!fetched) return;

    const { order, items } = fetched;

    const totalDeletes = items.length + 1; // items + the order itself

    // If everything fits in a single transact write, prefer that for atomicity
    if (totalDeletes <= 25) {
      type DeleteEntry = {
        Delete: {
          Key: { pk: string; sk: string };
          ConditionExpression?: string;
          ExpressionAttributeValues?: Record<string, unknown>;
          ExpressionAttributeNames?: Record<string, string>;
        };
      };

      const transactEntries: DeleteEntry[] = [
        ...items.map((it) => ({ Delete: { Key: { pk: it.pk, sk: it.sk } } })),
        { Delete: { Key: { pk: order.pk, sk: order.sk } } },
      ];

      await this.dynamoService.transactWriteItems(transactEntries);
      return;
    }

    // For larger numbers of items, use batchWrite to remove items in chunks and then delete order.
    // Note: this is not atomic across all items and the order due to DynamoDB limits.
    const deleteKeys = items.map((it) => ({ pk: it.pk, sk: it.sk }));

    // Batch delete items (batchWrite will chunk into 25-item batches internally)
    await this.dynamoService.batchWrite([], deleteKeys);

    // Finally remove the order record itself
    await this.dynamoService.deleteItem(order.pk, order.sk);
  }
}
