@echo off
echo ========================================
echo   SAMS Frontend Deployment to Vercel
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

REM Check if Vercel CLI is installed
where vercel >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [INFO] Vercel CLI not found. Installing...
    call npm install -g vercel
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Failed to install Vercel CLI
        pause
        exit /b 1
    )
)

echo [INFO] Vercel CLI version:
vercel --version
echo.

REM Login to Vercel
echo [INFO] Please login to Vercel...
vercel login
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Vercel login failed
    pause
    exit /b 1
)

echo.
echo [INFO] Deploying frontend to Vercel...
echo.

cd SAMS_FRONTEND

REM Deploy to Vercel
echo [INFO] Deploying to Vercel...
vercel --prod

if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Vercel deployment failed
    cd ..
    pause
    exit /b 1
)

cd ..

echo.
echo ========================================
echo   IMPORTANT: Environment Variable
echo ========================================
echo.
echo Please add this environment variable in Vercel dashboard:
echo.
echo   Name: VITE_API_BASE_URL
echo   Value: https://your-backend.railway.app/api
echo.
echo Replace 'your-backend.railway.app' with your actual Railway backend URL.
echo.
echo To add this:
echo 1. Go to your Vercel project dashboard
echo 2. Click on 'Settings'
echo 3. Click on 'Environment Variables'
echo 4. Add the variable and redeploy
echo.

echo ========================================
echo   Deployment Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Add the VITE_API_BASE_URL environment variable in Vercel
echo 2. Update FRONTEND_URL in Railway with your Vercel URL
echo 3. Test your application!
echo.

pause