#!/bin/bash

# DecisionOS Development Startup Script

set -e

echo "🚀 Starting DecisionOS Development Environment"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Start database
echo "📦 Starting PostgreSQL and Redis..."
docker-compose up -d

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
until docker-compose exec -T postgres pg_isready -U decisionos -d decisionos > /dev/null 2>&1; do
    sleep 2
done
echo "✅ Database is ready"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📥 Installing root dependencies..."
    npm install
fi

if [ ! -d "shared/node_modules" ]; then
    echo "📥 Installing shared dependencies..."
    cd shared && npm install && cd ..
fi

if [ ! -d "backend/node_modules" ]; then
    echo "📥 Installing backend dependencies..."
    cd backend && npm install && cd ..
fi

if [ ! -d "frontend/node_modules" ]; then
    echo "📥 Installing frontend dependencies..."
    cd frontend && npm install && cd ..
fi

# Build shared package
echo "🔨 Building shared package..."
cd shared && npm run build && cd ..

# Run database migrations
echo "🗄️ Running database migrations..."
cd backend && npx prisma migrate dev --name init && cd ..

# Seed database
echo "🌱 Seeding database..."
cd backend && npm run db:seed && cd ..

# Start development servers
echo "🚀 Starting development servers..."
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://localhost:3001"
echo "   API Health: http://localhost:3001/api/health"
echo ""
npm run dev