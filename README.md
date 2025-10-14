# DynamoDB Single Table Design - Proof of Concept

A TypeScript demonstration of DynamoDB single table design patterns using LocalStack.

## Quick Start

```bash
# Setup everything
npm run setup

# Seed sample data
npm run demo:seed

# Run query examples
npm run demo:query
```

# DynamoDB Single Table Design - Proof of Concept

A TypeScript demonstration of DynamoDB single table design patterns using LocalStack.

## Quick Start

Start LocalStack and set up the project (this will create the DynamoDB table and build the TypeScript):

```bash
# Start LocalStack and create the table, then build
npm run setup
```

Seed the demo data and run query examples:

```bash
npm run demo:seed
npm run demo:query
```

Note: it's recommended to run the demo scripts using the npm scripts (shown above) rather than invoking the `./scripts/with-env.sh` wrapper directly. Running via `npm run` ensures project-local binaries (like `ts-node`) from `node_modules/.bin` are available on PATH.

## Shorthand: npm run with-env

I've added a convenience npm script `with-env` that forwards to the `scripts/with-env.sh` wrapper.
It makes running LocalStack-aware commands a little shorter. Examples:

```bash
# List tables using the npm shorthand
npm run with-env -- aws --endpoint-url=http://localhost:4566 dynamodb list-tables --region eu-west-1

# Run any command with the LocalStack env set
npm run with-env -- <command> [args...]
```

The wrapper sets LocalStack-friendly AWS env vars and disables the AWS CLI pager to avoid suspended aws CLI processes in interactive shells.

## What This Demonstrates

- Single Table Design: Multiple entity types (Customers, Orders, Products) in one DynamoDB table
- Access Patterns: Efficient queries using partition keys and GSIs
- TypeScript: Strongly typed models with camelCase properties
- LocalStack: Local development without AWS costs

## Project Structure

```
src/
├── models/           # Entity definitions (Customer, Order, Product)
├── dal/              # Data access layer with DynamoDB operations
├── services/         # Business logic services
└── examples/         # Demo scripts showing usage patterns
```

## Available Commands

```bash
# Development
npm run build                # Build TypeScript
npm run lint                 # Check code quality

# LocalStack
npm run localstack:start     # Start LocalStack
npm run localstack:stop      # Stop LocalStack
npm run stack:deploy         # Deploy DynamoDB table (uses --endpoint-url to talk to LocalStack)

```

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
work: { addressLine1: '456 Office Ave', city: 'NYC' }
}
});

// Get customer's order history
const orders = await orderService.getOrdersByCustomer(customer.pk.split('#')[1]);

````

- If the LocalStack health endpoint isn't ready, `npm run setup` will wait and print logs. You can also check:

```bash
curl -s http://localhost:4566/health | jq .
docker-compose logs -f localstack
````

- If `aws` CLI commands seem to hang or get suspended in your shell, ensure you're using the wrapper (`./scripts/with-env.sh ...` or the npm shorthand `npm run with-env -- ...`) which sets `AWS_PAGER=""` and appropriate env vars.
- On macOS, if you used GNU `timeout` (gtimeout) and don't have it installed, install via `brew install coreutils` or use the wrapper's internal retry logic.

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
const orders = await orderService.getOrdersByCustomer(customer.pk.split('#')[1]);
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
