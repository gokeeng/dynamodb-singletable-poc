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

## What This Demonstrates

- **Single Table Design**: Multiple entity types (Users, Orders, Products) in one DynamoDB table
- **Access Patterns**: Efficient queries using partition keys and GSIs
- **TypeScript**: Strongly typed models with camelCase properties
- **LocalStack**: Local development without AWS costs

## Project Structure

```
src/
├── models/           # Entity definitions (User, Order, Product)
├── dal/             # Data access layer with DynamoDB operations  
├── services/        # Business logic services
└── examples/        # Demo scripts showing usage patterns
```

## Single Table Schema

| Entity | PK | SK | GSI1PK | GSI1SK | GSI2PK | GSI2SK |
|--------|----|----|--------|---------|---------|---------|
| User | `USER#{id}` | `USER#PROFILE` | `USER#EMAIL#{email}` | `USER#{id}` | - | - |
| Order | `ORDER#{id}` | `ORDER#DETAILS` | `USER#{userId}` | `ORDER#{date}` | `ORDER#STATUS#{status}` | `{date}` |
| Product | `PRODUCT#{id}` | `PRODUCT#DETAILS` | `PRODUCT#CATEGORY#{cat}` | `{brand}#{name}` | `PRODUCT#BRAND#{brand}` | `{cat}#{name}` |

## Key Features

✅ **Multiple addresses per user** - Home, work, billing addresses  
✅ **6 query patterns** - User lookup, order history, product search, etc.  
✅ **camelCase properties** - Following TypeScript best practices  
✅ **LocalStack integration** - No AWS account required  
✅ **CloudFormation** - Infrastructure as code  

## Available Commands

```bash
# Development
npm run build                # Build TypeScript
npm run lint                # Check code quality

# LocalStack
npm run localstack:start    # Start LocalStack
npm run localstack:stop     # Stop LocalStack  
npm run stack:deploy        # Deploy DynamoDB table

# Demo
npm run demo:seed          # Create sample data
npm run demo:query         # Show query patterns
```

## Usage Example

```typescript
import { UserService } from './services/user-service';
import { OrderService } from './services/order-service';

// Create user with multiple addresses
const user = await userService.createUser({
  email: 'john@example.com',
  firstName: 'John',
  lastName: 'Doe',
  address: {
    home: { addressLine1: '123 Main St', city: 'NYC', /* ... */ },
    work: { addressLine1: '456 Office Ave', city: 'NYC', /* ... */ }
  }
});

// Get user's order history
const orders = await orderService.getOrdersByUser(user.pk.split('#')[1]);
```

## Prerequisites

- Node.js 16+
- Docker & Docker Compose
- AWS CLI

## Learn More

- [Single Table Design Guide](https://www.alexdebrie.com/posts/dynamodb-single-table/)
- [DynamoDB Best Practices](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/best-practices.html)

## License

MIT
