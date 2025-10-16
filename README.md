# DynamoDB Single Table Design - Proof of Concept

A TypeScript demonstration of DynamoDB single table design patterns using LocalStack. It is based on the detailed example for the guidance found [here](https://trustpilot-production.atlassian.net/wiki/spaces/GPT/pages/2223996970/AWS+DynamoDB+Single+Table+Design+Guidance+Recommended+Patterns+and+Best+Practices).

## Quick Start

```bash
# Setup everything
npm run setup

# Seed sample data
npm run demo:seed

# Run query examples
npm run demo:examples
```

- If the LocalStack health endpoint isn't ready, `npm run setup` will wait and print logs. You can also check:

```bash
curl -s http://localhost:4566/health | jq .
docker-compose logs -f localstack
```

- If `aws` CLI commands seem to hang or get suspended in your shell, ensure you're using the wrapper (`./scripts/with-env.sh ...` or the npm shorthand `npm run with-env -- ...`) which sets `AWS_PAGER=""` and appropriate env vars.
- On macOS, if you used GNU `timeout` (gtimeout) and don't have it installed, install via `brew install coreutils` or use the wrapper's internal retry logic.

## What this POC demonstrates

This repository is a focused proof-of-concept. It demonstrates:

- Single table design with multiple entity types and access patterns
- Efficient access patterns using GSIs (Global Secondary Indexes)
- TypeScript models with strong typing
- A small service layer abstraction (CustomerService, OrderService)
- LocalStack integration for local development and integration tests

## Available commands

Use these npm scripts from the repository root (they call the wrapper to set LocalStack-friendly env vars):

- `npm run demo:seed` - Populate the table with sample data
- `npm run demo:examples` - Run query examples
- `npm run demo:clear` - Clear seeded sample data
- `npm run localstack:start` - Start LocalStack (docker-compose up -d)
- `npm run stack:deploy` - Deploy CloudFormation stack to LocalStack

## Quick 'Get started' steps

1. Make sure LocalStack is running: `npm run localstack:start`
2. Deploy the DynamoDB table: `npm run stack:deploy`
3. Seed some sample data: `npm run demo:seed`
4. Run query examples: `npm run demo:examples`

## Troubleshooting

If something goes wrong while following the steps above, try these checks:

- Make sure LocalStack is running and healthy:

```bash
curl -s http://localhost:4566/health | jq .
docker-compose logs -f localstack
```

- If the `aws` CLI commands seem to hang or be affected by your environment, use the project wrapper which ensures `AWS_PAGER=""` and other env vars are set: `./scripts/with-env.sh ...` or the npm shorthand `npm run with-env -- ...`.
- Ensure the DynamoDB table exists in LocalStack after deployment.
- Check logs and the LocalStack UI for any obvious errors.

## Usage Example (snippet)

```typescript
import { CustomerService } from './services/customer-service';
import { OrderService } from './services/order-service';

// Create customer with multiple addresses
const customer = await customerService.createCustomer({
  customerId: 'customer-123',
  email: 'john@example.com',
  firstName: 'John',
  lastName: 'Doe',
  address: {
    home: { addressLine1: '123 Main St', city: 'NYC' },
    work: { addressLine1: '456 Office Ave', city: 'NYC' },
  },
});

// Get customer's order history
const orders = await orderService.getOrdersByCustomer(customer.customerId);
```

Example: update an order status using the `OrderStatus` enum:

```typescript
import { OrderStatus } from './models/models';

// mark an order as shipped
await orderService.updateOrderStatus(orderId, OrderStatus.SHIPPED);
```

## Prerequisites

- Node.js 16+
- Docker & Docker Compose
- AWS CLI (optional; the wrapper sets env for LocalStack so AWS credentials are not required)

## Learn More

- [Single Table Design Guide](https://www.alexdebrie.com/posts/dynamodb-single-table/)
- [DynamoDB Best Practices](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/best-practices.html)

## License

MIT
