#!/bin/bash

echo "========================================"
echo "  SAMS Backend Deployment to Railway"
echo "========================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js is not installed!"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

echo "[INFO] Node.js version:"
node --version
echo ""

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "[INFO] Railway CLI not found. Installing..."
    npm install -g @railway/cli
    if [ $? -ne 0 ]; then
        echo "[ERROR] Failed to install Railway CLI"
        exit 1
    fi
fi

echo "[INFO] Railway CLI version:"
railway --version
echo ""

# Login to Railway
echo "[INFO] Please login to Railway..."
railway login
if [ $? -ne 0 ]; then
    echo "[ERROR] Railway login failed"
    exit 1
fi

echo ""
echo "[INFO] Deploying backend to Railway..."
echo ""

cd student-attendance-management-system

# Initialize or link Railway project
echo "[INFO] Initializing Railway project..."
railway init

echo ""
echo "========================================"
echo "  IMPORTANT: Environment Variables"
echo "========================================"
echo ""
echo "Please add these environment variables in Railway dashboard:"
echo ""
echo "  NODE_ENV=production"
echo "  PORT=5000"
echo "  DATABASE_URL=your-supabase-connection-string"
echo "  ACCESS_TOKEN_SECRET=your-secret-key"
echo "  ACCESS_TOKEN_EXPIRY=1h"
echo "  REFRESH_TOKEN_SECRET=your-refresh-secret"
echo "  REFRESH_TOKEN_EXPIRY=7d"
echo "  EMAIL_HOST=smtp.gmail.com"
echo "  EMAIL_PORT=587"
echo "  EMAIL_USER=your-email@gmail.com"
echo "  EMAIL_PASSWORD=your-app-password"
echo "  FRONTEND_URL=https://your-frontend.vercel.app"
echo "  REDIS_HOST=your-redis-host"
echo "  REDIS_PORT=your-redis-port"
echo "  REDIS_PASSWORD=your-redis-password"
echo ""
echo "After adding variables, the deployment will continue..."
echo ""
read -p "Press Enter to continue..."

# Deploy to Railway
echo "[INFO] Deploying to Railway..."
railway up

echo ""
echo "========================================"
echo "  Deployment Complete!"
echo "========================================"
echo ""
echo "Next steps:"
echo "1. Check your Railway dashboard for the deployment URL"
echo "2. Deploy the frontend to Vercel"
echo "3. Update FRONTEND_URL in Railway with your Vercel URL"
echo ""

cd ..