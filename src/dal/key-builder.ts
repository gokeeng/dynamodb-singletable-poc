/**
 * Utility functions for creating standardized keys
 */

import { EntityTypes } from '../models/models';
import ConditionExpressionBuilder, {
  ConditionExpressionParts,
} from './condition-expression-builder';

export class KeyBuilder {
  static customerPK(customerId: string): string {
    return `${EntityTypes.CUSTOMER}#${customerId}`;
  }

  static customerSK(customerId: string): string {
    return `${EntityTypes.CUSTOMER}#${customerId}`;
  }

  static customerEmailPK(email: string): string {
    return `${EntityTypes.CUSTOMER_EMAIL}#${email}`;
  }

  static customerEmailSK(email: string): string {
    return `${EntityTypes.CUSTOMER_EMAIL}#${email}`;
  }

  static orderPK(customerId: string): string {
    return `${EntityTypes.CUSTOMER}#${customerId}`;
  }

  static orderSK(orderId: string): string {
    return `#${EntityTypes.ORDER}#${orderId}`;
  }

  // SK prefix for orders when stored under a customer PK. This is used with begins_with
  // to query all orders for a customer.
  static ordersSKPrefix(): string {
    // Order SKs are created as `#Order#<orderId>` so include the leading '#' to
    // match the stored sort key prefix when using begins_with(sk, :sk).
    return `#${EntityTypes.ORDER}#`;
  }

  static orderItemPK(orderId: string, productId: string): string {
    return `${EntityTypes.ORDER}#${orderId}#${EntityTypes.ORDER_ITEM}#${productId}`;
  }

  static orderItemSK(orderId: string, productId: string): string {
    return `#${EntityTypes.ORDER}#${orderId}#${EntityTypes.ORDER_ITEM}#${productId}`;
  }

  static productPK(productId: string): string {
    return `${EntityTypes.PRODUCT}#${productId}`;
  }

  static productSK(): string {
    return `${EntityTypes.PRODUCT}#DETAILS`;
  }

  static ordersGSI1(orderId: string): { gsi1pk: string; gsi1sk: string } {
    return {
      // GSI1 is used to look up an order and its items by orderId.
      // Use an Order-scoped GSI partition key so queries by orderId return the order and its items.
      gsi1pk: `${EntityTypes.ORDER}#${orderId}`,
      // For the order record itself use an SK that identifies it as the ORDER record
      gsi1sk: `${EntityTypes.ORDER}#${orderId}`,
    };
  }

  static orderItemsGSI1(orderId: string, itemId: string): { gsi1pk: string; gsi1sk: string } {
    return {
      // Items for an order should share the same GSI1 partition key as the order itself
      gsi1pk: `${EntityTypes.ORDER}#${orderId}`,
      // Sort key distinguishes individual items within the order
      gsi1sk: `${EntityTypes.ORDER_ITEM}#${itemId}`,
    };
  }

  /**
   * Build the SK condition used to query orders under a customer PK. Returns a
   * ConditionExpressionParts object (ConditionExpression, names and values)
   * produced by the ConditionExpressionBuilder so callers can pass the tokens
   * directly into DynamoDB query options.
   */
  static ordersSKCondition(): ConditionExpressionParts {
    return ConditionExpressionBuilder.attr('sk')
      .beginsWith(KeyBuilder.ordersSKPrefix())
      .toExpression();
  }

  /**
   * Return the KeyConditionExpression string and the bound value for querying
   * orders under a customer. This makes it easy for callers to pass the
   * condition and the value to DynamoDB query methods without hard-coded strings.
   */
  static ordersSKKeyCondition(): { skCondition: string; skValue: string } {
    return { skCondition: 'begins_with(sk, :sk)', skValue: KeyBuilder.ordersSKPrefix() };
  }
}
