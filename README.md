# DynamoDB Single Table Design - Proof of Concept

A comprehensive TypeScript demonstration of DynamoDB single table design patterns using LocalStack for local development.

## 🏗️ Architecture Overview

This project demonstrates how to implement a single table design in DynamoDB, where multiple entity types (Users, Orders, Products, Reviews) are stored in one table with carefully designed access patterns.

### Key Concepts

- **Single Table Design**: Store all entity types in one DynamoDB table
- **Global Secondary Indexes (GSIs)**: Enable efficient querying across different access patterns
- **Composite Keys**: Use meaningful partition and sort keys for optimal performance
- **TypeScript Models**: Strongly typed entity definitions with helper methods

## 📋 Table of Contents

- [Quick Start](#-quick-start)
- [Project Structure](#-project-structure)
- [Single Table Design](#-single-table-design)
- [Entity Models](#-entity-models)
- [Access Patterns](#-access-patterns)
- [API Reference](#-api-reference)
- [Development](#-development)
- [Examples](#-examples)
- [Troubleshooting](#-troubleshooting)

## 🚀 Quick Start

### Prerequisites

- Node.js (v16 or higher)
- Docker and Docker Compose
- AWS CLI

### One-Command Setup

```bash
npm run setup
```

This will:
1. Install dependencies
2. Start LocalStack
3. Deploy the DynamoDB table
4. Build the TypeScript code

### Manual Setup

1. **Clone and install dependencies**
   ```bash
   git clone <repository-url>
   cd dynamodb-singletable-poc
   npm install
   ```

2. **Start LocalStack**
   ```bash
   npm run localstack:start
   ```

3. **Deploy the DynamoDB table**
   ```bash
   npm run stack:deploy
   ```

4. **Build the project**
   ```bash
   npm run build
   ```

5. **Seed sample data**
   ```bash
   npm run demo:seed
   ```

6. **Run query examples**
   ```bash
   npm run demo:query
   ```

7. **Monitor with LocalStack** (optional)
   ```bash
   npm run localstack:logs    # View LocalStack service logs
   npm run stack:status       # Check CloudFormation stack status
   ```

## 📁 Project Structure

```
dynamodb-singletable-poc/
├── src/
│   ├── models/              # Entity definitions and key builders
│   │   ├── base.ts         # Base entity interface and key helpers
│   │   ├── user.ts         # User entity model
│   │   ├── order.ts        # Order entity model
│   │   ├── product.ts      # Product entity model
│   │   └── review.ts       # Review entity model
│   ├── services/           # Service layer for DynamoDB operations
│   │   ├── dynamodb-client.ts      # DynamoDB client factory
│   │   ├── dynamodb-service.ts     # Generic DynamoDB operations
│   │   ├── user-service.ts         # User-specific operations
│   │   └── order-service.ts        # Order-specific operations
│   ├── examples/           # Demo scripts and examples
│   │   ├── seed-data.ts    # Sample data seeding
│   │   └── query-examples.ts       # Query pattern demonstrations
│   └── index.ts           # Main entry point
├── infrastructure/         # CloudFormation templates
│   └── dynamodb-stack.yml # DynamoDB table definition
├── scripts/               # Development scripts
│   └── setup.sh          # Automated setup script
├── docker-compose.yml     # LocalStack configuration
└── package.json          # Dependencies and scripts
```

## 🗂️ Single Table Design

### Table Structure

| Attribute | Type | Description |
|-----------|------|-------------|
| PK | String | Partition Key - Entity type + ID |
| SK | String | Sort Key - Entity type + additional info |
| GSI1PK | String | GSI1 Partition Key - For alternative access patterns |
| GSI1SK | String | GSI1 Sort Key - For alternative access patterns |
| GSI2PK | String | GSI2 Partition Key - For additional access patterns |
| GSI2SK | String | GSI2 Sort Key - For additional access patterns |
| EntityType | String | Type of entity (USER, ORDER, PRODUCT, REVIEW) |
| ... | ... | Entity-specific attributes |

### Key Patterns

| Entity | PK Pattern | SK Pattern | GSI1PK | GSI1SK | GSI2PK | GSI2SK |
|--------|------------|------------|---------|---------|---------|---------|
| User | `USER#{userId}` | `USER#PROFILE` | `USER#EMAIL` | `{email}` | `ORG#{orgId}` | `USER#{userId}` |
| Order | `ORDER#{orderId}` | `ORDER#DETAILS` | `USER#{userId}` | `ORDER#` | `ORDER#STATUS#{status}` | `{orderDate}` |
| Product | `PRODUCT#{productId}` | `PRODUCT#DETAILS` | `PRODUCT#CATEGORY#{category}` | `{brand}#{name}` | `PRODUCT#BRAND#{brand}` | `{category}#{name}` |
| Review | `REVIEW#{reviewId}` | `REVIEW#DETAILS` | `USER#{userId}` | `REVIEW#{timestamp}` | `PRODUCT#{productId}` | `REVIEW#{rating}#{timestamp}` |

## 🧩 Entity Models

### User
```typescript
interface User {
  UserId: string;
  Email: string;
  FirstName: string;
  LastName: string;
  Status: UserStatus;
  // ... additional fields
}
```

### Order
```typescript
interface Order {
  OrderId: string;
  UserId: string;
  Status: OrderStatus;
  TotalAmount: number;
  Items: OrderItem[];
  // ... additional fields
}
```

### Product
```typescript
interface Product {
  ProductId: string;
  Name: string;
  Category: string;
  Brand: string;
  Price: number;
  // ... additional fields
}
```

### Review
```typescript
interface Review {
  ReviewId: string;
  ProductId: string;
  UserId: string;
  Rating: number;
  Title: string;
  Content: string;
  // ... additional fields
}
```

## 🔍 Access Patterns

### Primary Access Patterns

1. **Get user by ID**
   - Query: `PK = USER#{userId} AND SK = USER#PROFILE`

2. **Get user by email**
   - Query: `GSI1PK = USER#EMAIL AND GSI1SK = {email}`

3. **Get user's orders**
   - Query: `GSI1PK = USER#{userId} AND begins_with(GSI1SK, ORDER#)`

4. **Get orders by status**
   - Query: `GSI2PK = ORDER#STATUS#{status}`

5. **Get products by category**
   - Query: `GSI1PK = PRODUCT#CATEGORY#{category}`

6. **Get reviews for product**
   - Query: `GSI2PK = PRODUCT#{productId} AND begins_with(GSI2SK, REVIEW#)`

## 📚 API Reference

### UserService

```typescript
const userService = new UserService(dynamoService);

// Create user
const user = await userService.createUser({
  UserId: 'user-123',
  Email: 'user@example.com',
  FirstName: 'John',
  LastName: 'Doe',
  Status: UserStatus.ACTIVE
});

// Get user by ID
const user = await userService.getUserById('user-123');

// Get user by email
const user = await userService.getUserByEmail('user@example.com');

// Update user
const updatedUser = await userService.updateUser('user-123', {
  FirstName: 'Jane'
});
```

### OrderService

```typescript
const orderService = new OrderService(dynamoService);

// Create order
const order = await orderService.createOrder({
  OrderId: 'order-456',
  UserId: 'user-123',
  Status: OrderStatus.PENDING,
  TotalAmount: 99.99,
  Items: [/* order items */]
});

// Get user's orders
const orders = await orderService.getOrdersByUser('user-123');

// Get orders by status
const processingOrders = await orderService.getOrdersByStatus(OrderStatus.PROCESSING);
```

## 🛠️ Development

### Available Scripts

```bash
# Development
npm run dev              # Run in development mode
npm run build           # Build TypeScript
npm run clean           # Clean build artifacts

# LocalStack
npm run localstack:start    # Start LocalStack
npm run localstack:stop     # Stop LocalStack

npm run localstack:logs     # View LocalStack logs

# CloudFormation
npm run stack:deploy        # Deploy DynamoDB stack
npm run stack:delete        # Delete DynamoDB stack
npm run stack:status        # Check stack status

# Demo
npm run demo:seed          # Seed sample data
npm run demo:query         # Run query examples

# Linting
npm run lint              # Run ESLint
npm run lint:fix          # Fix ESLint issues

# Setup
npm run setup             # Complete setup (one command)
```

### Environment Variables

Create a `.env` file (copy from `.env.example`):

```bash
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test
AWS_DEFAULT_REGION=eu-west-1
DYNAMODB_ENDPOINT=http://localhost:4566
TABLE_NAME=Bookstore
```

### LocalStack Management

LocalStack Community Edition provides API access to AWS services locally:

**Available interfaces:**
- REST API endpoints at http://localhost:4566
- AWS CLI with `--endpoint-url=http://localhost:4566`
- AWS SDKs configured for LocalStack endpoint

**Management:**
- **View logs**: `npm run localstack:logs`
- **Check status**: `npm run stack:status`
- **Browse via CLI**: Use AWS CLI commands with LocalStack endpoint

## 💡 Examples

### Basic Usage

```typescript
import { DynamoDBService, UserService } from './services';

// Initialize services
const dynamoService = new DynamoDBService();
const userService = new UserService(dynamoService);

// Create a user
const user = await userService.createUser({
  UserId: 'user-123',
  Email: 'john@example.com',
  FirstName: 'John',
  LastName: 'Doe',
  Status: UserStatus.ACTIVE
});

// Query user's orders
const orders = await orderService.getOrdersByUser(user.UserId);
```

### Advanced Queries

```typescript
// Query with filters and pagination
const result = await dynamoService.queryGSI1('USER#EMAIL', undefined, {
  filterExpression: '#status = :status',
  expressionAttributeNames: { '#status': 'Status' },
  expressionAttributeValues: { ':status': 'ACTIVE' },
  limit: 20
});

// Batch operations
await dynamoService.batchWrite([user1, user2], []);
const users = await dynamoService.batchGet([
  { PK: 'USER#1', SK: 'USER#PROFILE' },
  { PK: 'USER#2', SK: 'USER#PROFILE' }
]);
```

## 🔧 Troubleshooting

### Common Issues

1. **Docker permission errors (macOS)**
   ```bash
   # Quick fix for most Docker issues
   npm run fix-docker
   
   # Or manually:
   docker-compose down -v
   docker system prune -f
   docker-compose up -d
   ```

2. **LocalStack not starting**
   ```bash
   # Check if Docker is running
   docker --version
   
   # View LocalStack logs
   docker-compose logs localstack
   
   # Restart LocalStack
   docker-compose down
   docker-compose up -d
   ```

3. **CloudFormation deployment fails**
   ```bash
   # Check LocalStack logs
   docker-compose logs localstack
   
   # Verify AWS CLI configuration
   aws configure list --profile localstack
   
   # Test LocalStack connectivity
   curl http://localhost:4566/health
   ```

4. **DynamoDB connection errors**
   ```bash
   # Check environment variables
   cat .env
   
   # Test connection
   aws --endpoint-url=http://localhost:4566 dynamodb list-tables
   
   # Verify LocalStack is running
   docker-compose ps
   ```

5. **TypeScript compilation errors**
   ```bash
   # Clean and rebuild
   npm run clean
   npm run build
   
   # Check for missing dependencies
   npm install
   ```

### Debug Mode

Enable debug logging by setting:
```bash
DEBUG=1
```

### Reset Everything

```bash
# Stop LocalStack and remove data
docker-compose down -v

# Clean build artifacts
npm run clean

# Remove node_modules
rm -rf node_modules

# Reinstall and restart
npm install
npm run setup
```

## 🎯 Benefits of Single Table Design

✅ **Performance**: Consistent single-digit millisecond latency
✅ **Cost-effective**: Fewer tables mean lower costs
✅ **Scalability**: Handle millions of requests per second
✅ **Simplicity**: One table to manage instead of many
✅ **Consistency**: Strong consistency within partition
✅ **Flexibility**: Easy to add new access patterns with GSIs

## 📖 Learn More

- [DynamoDB Single Table Design](https://www.alexdebrie.com/posts/dynamodb-single-table/)
- [AWS DynamoDB Best Practices](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/best-practices.html)
- [LocalStack Documentation](https://docs.localstack.cloud/)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.
