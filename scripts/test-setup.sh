#!/bin/bash

# Test LocalStack and DynamoDB connectivity

echo "🧪 Testing LocalStack connectivity..."

export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test
export AWS_DEFAULT_REGION=eu-west-1

# Test LocalStack health
echo "1. Testing LocalStack health..."
if curl -s http://localhost:4566/_localstack/health >/dev/null; then
    echo "✅ LocalStack is responding"
else
    echo "❌ LocalStack is not responding"
    echo "💡 Try: docker-compose logs localstack"
    exit 1
fi

# Test DynamoDB service
echo "2. Testing DynamoDB service..."
TABLES=$(aws dynamodb list-tables --endpoint-url=http://localhost:4566 --region=eu-west-1 --output=text --query='TableNames[0]' 2>/dev/null)

if [ $? -eq 0 ]; then
    echo "✅ DynamoDB service is working"
    if [ "$TABLES" = "SingleTable" ]; then
        echo "✅ SingleTable exists"
    elif [ "$TABLES" = "None" ] || [ -z "$TABLES" ]; then
        echo "⚠️  No tables found - need to deploy CloudFormation stack"
        echo "   Run: npm run stack:deploy"
    else
        echo "✅ Found tables: $TABLES"
    fi
else
    echo "❌ DynamoDB service is not working"
    exit 1
fi

# Test our TypeScript build
echo "3. Testing TypeScript build..."
if [ -f "dist/index.js" ]; then
    echo "✅ TypeScript build exists"
else
    echo "❌ TypeScript build not found"
    echo "   Run: npm run build"
    exit 1
fi

echo ""
echo "🎉 All tests passed! You can now:"
echo "   • Deploy the stack: npm run stack:deploy"
echo "   • Seed data: npm run demo:seed" 
echo "   • Run queries: npm run demo:query"