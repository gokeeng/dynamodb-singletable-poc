#!/bin/bash

# Wrapper script to run demo with proper LocalStack environment variables

export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test
export AWS_DEFAULT_REGION=eu-west-1
export DYNAMODB_ENDPOINT=http://localhost:4566
export TABLE_NAME=Bookstore

echo "🌍 Environment configured for LocalStack:"
echo "   AWS_ACCESS_KEY_ID: $AWS_ACCESS_KEY_ID"
echo "   AWS_SECRET_ACCESS_KEY: $AWS_SECRET_ACCESS_KEY"
echo "   AWS_DEFAULT_REGION: $AWS_DEFAULT_REGION"
echo "   DYNAMODB_ENDPOINT: $DYNAMODB_ENDPOINT"
echo "   TABLE_NAME: $TABLE_NAME"
echo ""

# Run the command passed as arguments
exec "$@"