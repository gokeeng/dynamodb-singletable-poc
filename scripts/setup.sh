#!/bin/bash

# DynamoDB Single Table POC - Development Setup Script

echo "🚀 Setting up DynamoDB Single Table POC..."

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo "🔍 Checking prerequisites..."

if ! command_exists docker; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command_exists docker-compose; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

if ! command_exists npm; then
    echo "❌ npm is not installed. Please install Node.js and npm first."
    exit 1
fi

if ! command_exists aws; then
    echo "⚠️  AWS CLI is not installed. Installing via brew (macOS)..."
    if command_exists brew; then
        brew install awscli
    else
        echo "❌ Please install AWS CLI manually"
        exit 1
    fi
fi

echo "✅ All prerequisites are available"

# Install dependencies
echo "📦 Installing npm dependencies..."
npm install

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "✅ Created .env file. You can modify it if needed."
fi

# Clean up any existing containers and volumes
echo "🧹 Cleaning up existing LocalStack containers..."
docker-compose down -v 2>/dev/null || true

# Start LocalStack
echo "🐳 Starting LocalStack..."
if ! docker-compose up -d; then
    echo "❌ Failed to start LocalStack. Trying alternative approach..."
    
    # Try removing any existing containers and starting fresh
    docker-compose down -v 2>/dev/null || true
    docker system prune -f 2>/dev/null || true
    
    echo "🔄 Retrying LocalStack startup..."
    if ! docker-compose up -d; then
        echo "❌ Failed to start LocalStack. Please check Docker permissions and try:"
        echo "   1. Make sure Docker Desktop is running"
        echo "   2. Try: docker-compose down -v && docker-compose up -d"
        echo "   3. Check Docker logs: docker-compose logs localstack"
        exit 1
    fi
fi

echo "✅ LocalStack started successfully"

# Wait for LocalStack to be ready
echo "⏳ Waiting for LocalStack to be ready..."
sleep 15

# Test LocalStack connectivity
echo "🔍 Testing LocalStack connectivity..."
max_attempts=30
attempt=1

while [ $attempt -le $max_attempts ]; do
    if curl -s http://localhost:4566/health > /dev/null 2>&1; then
        echo "✅ LocalStack is ready!"
        break
    elif [ $attempt -eq $max_attempts ]; then
        echo "❌ LocalStack failed to become ready after ${max_attempts} attempts"
        echo "📋 Debug information:"
        docker-compose logs localstack | tail -20
        exit 1
    else
        echo "⏳ Waiting for LocalStack... (attempt $attempt/$max_attempts)"
        sleep 2
        attempt=$((attempt + 1))
    fi
done

# Configure AWS CLI for LocalStack
echo "🔧 Configuring AWS CLI for LocalStack..."
aws configure set aws_access_key_id test --profile localstack
aws configure set aws_secret_access_key test --profile localstack
aws configure set region eu-west-1 --profile localstack

# Deploy CloudFormation stack
echo "☁️  Deploying DynamoDB CloudFormation stack..."
aws --endpoint-url=http://localhost:4566 --profile localstack cloudformation deploy \
    --template-file infrastructure/dynamodb-stack.yml \
    --stack-name dynamodb-singletable \
    --region eu-west-1

if [ $? -eq 0 ]; then
    echo "✅ CloudFormation stack deployed successfully"
else
    echo "❌ Failed to deploy CloudFormation stack"
    exit 1
fi

# Build TypeScript
echo "🔨 Building TypeScript..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ TypeScript build successful"
else
    echo "❌ TypeScript build failed"
    exit 1
fi

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "📚 Next steps:"
echo "  1. Run demo seed: npm run demo:seed"
echo "  2. Run query examples: npm run demo:query"
echo "  3. Start development: npm run dev"
echo ""
echo "🛠️  Useful commands:"
echo "  • View LocalStack logs: docker-compose logs -f"
echo "  • Stop LocalStack: docker-compose down"
echo "  • Rebuild: npm run clean && npm run build"
echo ""