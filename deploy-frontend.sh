#!/bin/bash

echo "========================================"
echo "  SAMS Frontend Deployment to Vercel"
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

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "[INFO] Vercel CLI not found. Installing..."
    npm install -g vercel
    if [ $? -ne 0 ]; then
        echo "[ERROR] Failed to install Vercel CLI"
        exit 1
    fi
fi

echo "[INFO] Vercel CLI version:"
vercel --version
echo ""

# Login to Vercel
echo "[INFO] Please login to Vercel..."
vercel login
if [ $? -ne 0 ]; then
    echo "[ERROR] Vercel login failed"
    exit 1
fi

echo ""
echo "[INFO] Deploying frontend to Vercel..."
echo ""

cd SAMS_FRONTEND

# Deploy to Vercel
echo "[INFO] Deploying to Vercel..."
vercel --prod

if [ $? -ne 0 ]; then
    echo "[ERROR] Vercel deployment failed"
    cd ..
    exit 1
fi

cd ..

echo ""
echo "========================================"
echo "  IMPORTANT: Environment Variable"
echo "========================================"
echo ""
echo "Please add this environment variable in Vercel dashboard:"
echo ""
echo "  Name: VITE_API_BASE_URL"
echo "  Value: https://your-backend.railway.app/api"
echo ""
echo "Replace 'your-backend.railway.app' with your actual Railway backend URL."
echo ""
echo "To add this:"
echo "1. Go to your Vercel project dashboard"
echo "2. Click on 'Settings'"
echo "3. Click on 'Environment Variables'"
echo "4. Add the variable and redeploy"
echo ""

echo "========================================"
echo "  Deployment Complete!"
echo "========================================"
echo ""
echo "Next steps:"
echo "1. Add the VITE_API_BASE_URL environment variable in Vercel"
echo "2. Update FRONTEND_URL in Railway with your Vercel URL"
echo "3. Test your application!"
echo ""