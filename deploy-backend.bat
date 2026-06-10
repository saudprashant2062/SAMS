@echo off
echo ========================================
echo   SAMS Backend Deployment to Railway
echo ========================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo [INFO] Node.js version:
node --version
echo.

REM Check if Railway CLI is installed
where railway >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [INFO] Railway CLI not found. Installing...
    call npm install -g @railway/cli
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Failed to install Railway CLI
        pause
        exit /b 1
    )
)

echo [INFO] Railway CLI version:
railway --version
echo.

REM Login to Railway
echo [INFO] Please login to Railway...
railway login
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Railway login failed
    pause
    exit /b 1
)

echo.
echo [INFO] Deploying backend to Railway...
echo.

cd student-attendance-management-system

REM Initialize or link Railway project
echo [INFO] Initializing Railway project...
railway init

echo.
echo ========================================
echo   IMPORTANT: Environment Variables
echo ========================================
echo.
echo Please add these environment variables in Railway dashboard:
echo.
echo   NODE_ENV=production
echo   PORT=5000
echo   DATABASE_URL=your-supabase-connection-string
echo   ACCESS_TOKEN_SECRET=your-secret-key
echo   ACCESS_TOKEN_EXPIRY=1h
echo   REFRESH_TOKEN_SECRET=your-refresh-secret
echo   REFRESH_TOKEN_EXPIRY=7d
echo   EMAIL_HOST=smtp.gmail.com
echo   EMAIL_PORT=587
echo   EMAIL_USER=your-email@gmail.com
echo   EMAIL_PASSWORD=your-app-password
echo   FRONTEND_URL=https://your-frontend.vercel.app
echo   REDIS_HOST=your-redis-host
echo   REDIS_PORT=your-redis-port
echo   REDIS_PASSWORD=your-redis-password
echo.
echo After adding variables, the deployment will continue...
echo.
pause

REM Deploy to Railway
echo [INFO] Deploying to Railway...
railway up

echo.
echo ========================================
echo   Deployment Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Check your Railway dashboard for the deployment URL
echo 2. Deploy the frontend to Vercel
echo 3. Update FRONTEND_URL in Railway with your Vercel URL
echo.

cd ..
pause