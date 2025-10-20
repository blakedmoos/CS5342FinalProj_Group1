#!/bin/bash

echo "🚀 Initializing Database via API..."
echo "This will take 2-3 minutes to process all PDFs..."
echo ""

# Call the initialization endpoint
response=$(curl -s -X POST http://localhost:3000/api/init)

echo "Response: $response"
echo ""
echo "✅ Check status with: curl http://localhost:3000/api/init"
