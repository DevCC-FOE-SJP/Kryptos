#!/bin/bash

echo "🚀 Setting up Kryptos Certificate Verification..."
echo ""

# Check if .env exists, if not copy from example
if [ ! -f ".env" ]; then
    echo "📝 Creating frontend .env file from example..."
    cp .env.example .env
    echo "✅ Frontend .env created"
else
    echo "✅ Frontend .env already exists"
fi

# Check if backend/.env exists, if not copy from example  
if [ ! -f "backend/.env" ]; then
    echo "📝 Creating backend .env file from example..."
    cp backend/.env.example backend/.env
    echo "✅ Backend .env created"
else
    echo "✅ Backend .env already exists"
fi

echo ""
echo "⚠️  IMPORTANT NEXT STEPS:"
echo "   1. Get your FREE Blockfrost API key from: https://blockfrost.io/"
echo "   2. Create a project and select 'Cardano Preprod' network"
echo "   3. Edit .env and replace 'your_blockfrost_api_key_here' with your actual key"
echo "   4. Edit backend/.env and replace 'your_blockfrost_api_key_here' with your actual key"
echo ""
echo "📖 See TEAM_SETUP.md for detailed instructions"
echo "🚀 After setup, run: npm install && cd backend && npm install"
