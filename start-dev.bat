@echo off
REM DecisionOS Development Startup Script for Windows

echo 🚀 Starting DecisionOS Development Environment

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not running. Please start Docker first.
    exit /b 1
)

echo 📦 Starting PostgreSQL and Redis...
docker-compose up -d

echo ⏳ Waiting for database to be ready...
:wait_db
docker-compose exec -T postgres pg_isready -U decisionos -d decisionos >nul 2>&1
if %errorlevel% neq 0 (
    timeout /t 2 >nul
    goto wait_db
)
echo ✅ Database is ready

REM Install dependencies if needed
if not exist "node_modules" (
    echo 📥 Installing root dependencies...
    npm install
)

if not exist "shared\node_modules" (
    echo 📥 Installing shared dependencies...
    cd shared && npm install && cd ..
)

if not exist "backend\node_modules" (
    echo 📥 Installing backend dependencies...
    cd backend && npm install && cd ..
)

if not exist "frontend\node_modules" (
    echo 📥 Installing frontend dependencies...
    cd frontend && npm install && cd ..
)

echo 🔨 Building shared package...
cd shared && npm run build && cd ..

echo 🗄️ Running database migrations...
cd backend && npx prisma migrate dev --name init && cd ..

echo 🌱 Seeding database...
cd backend && npm run db:seed && cd ..

echo 🚀 Starting development servers...
echo    Frontend: http://localhost:5173
echo    Backend:  http://localhost:3001
echo    API Health: http://localhost:3001/api/health
echo.

npm run dev