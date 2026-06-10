# SAMS Deployment Guide

This guide will help you deploy the Student Attendance Management System (SAMS) to free hosting platforms.

## 📋 Prerequisites

- Git installed on your computer
- GitHub account
- Railway account (for backend)
- Vercel account (for frontend)
- Supabase account (already set up)
- Node.js installed (for running deployment scripts)

## 🚀 Deployment Overview

| Component | Platform | URL Format | Cost |
|-----------|----------|------------|------|
| Frontend | Vercel | `your-app.vercel.app` | Free |
| Backend | Railway | `your-app.railway.app` | Free ($5 credit/month) |
| Database | Supabase | Already configured | Free |

## 🤖 Quick Deployment with Automated Scripts

We've created automated deployment scripts to simplify the process! Choose the script based on your operating system:

### Windows

```bash
# Deploy Backend
./deploy-backend.bat

# Deploy Frontend
./deploy-frontend.bat
```

### Mac/Linux

```bash
# Deploy Backend
./deploy-backend.sh

# Deploy Frontend
./deploy-frontend.sh
```

### Using Node.js (Cross-platform)

```bash
# Install Railway and Vercel CLIs first
npm install -g @railway/cli vercel

# Deploy everything
node deploy.js --all

# Or deploy individually
node deploy.js --backend   # Backend only
node deploy.js --frontend  # Frontend only
```

## 📝 Manual Deployment (Step-by-Step)

If you prefer to deploy manually or the scripts don't work, follow these steps:

### 1. Push Your Code to GitHub

First, make sure your code is pushed to GitHub:

```bash
cd SAMS
git add .
git commit -m "Prepare for deployment"
git push origin main
```

### 2. Deploy Backend to Railway

1. **Go to [Railway](https://railway.app/) and sign up/login**

2. **Create a new project:**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Connect your GitHub account
   - Select the SAMS repository

3. **Configure the backend service:**
   - Railway will auto-detect your project
   - Click on the service and go to "Settings"
   - Set the **Root Directory** to `student-attendance-management-system`
   - Set the **Start Command** to: `npm run prisma:generate && npm start`

4. **Add Environment Variables:**
   Click on "Variables" and add the following:

   ```
   NODE_ENV=production
   PORT=5000
   DATABASE_URL=postgresql://postgres.tmocnsxaracanbrrdshg:N2Q1nPeffYyGUOKU@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres
   ACCESS_TOKEN_SECRET=UxjJJSEl2EWwCjC21vAx4GZP
   ACCESS_TOKEN_EXPIRY=1h
   REFRESH_TOKEN_SECRET=kMNt7Nm6SO0vBXVvyEC4oFY5
   REFRESH_TOKEN_EXPIRY=7d
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=aryansaud080@gmail.com
   EMAIL_PASSWORD=eldy ahps megp bcec
   FRONTEND_URL=https://your-frontend.vercel.app
   REDIS_HOST=redis-18808.c292.ap-southeast-1-1.ec2.cloud.redislabs.com
   REDIS_PORT=18808
   REDIS_PASSWORD=oNhyeMV8JFua60rOR2jyEtp96pfkJeY3
   ```

   > ⚠️ **Important**: Update `FRONTEND_URL` after deploying the frontend!

5. **Deploy:**
   - Railway will automatically deploy your backend
   - Copy the generated URL (e.g., `https://sams-backend-production.up.railway.app`)

### 3. Deploy Frontend to Vercel

1. **Go to [Vercel](https://vercel.com/) and sign up/login**

2. **Import your project:**
   - Click "Add New Project"
   - Select "Import Git Repository"
   - Connect your GitHub account
   - Select the SAMS repository

3. **Configure the frontend:**
   - Framework Preset: `Vite`
   - Root Directory: `SAMS_FRONTEND`
   - Build Command: `npm run build`
   - Output Directory: `dist`

4. **Add Environment Variables:**
   Click on "Environment Variables" and add:

   ```
   VITE_API_BASE_URL=https://your-backend.railway.app/api
   ```

   > Replace `your-backend.railway.app` with your actual Railway backend URL

5. **Deploy:**
   - Click "Deploy"
   - Vercel will build and deploy your frontend
   - Copy the generated URL (e.g., `https://sams-frontend.vercel.app`)

### 4. Update Backend FRONTEND_URL

Go back to Railway and update the `FRONTEND_URL` environment variable with your Vercel frontend URL:

```
FRONTEND_URL=https://sams-frontend.vercel.app
```

Railway will automatically redeploy with the updated configuration.

## ✅ Verification

1. **Test the backend:**
   - Visit `https://your-backend.railway.app/api/docs`
   - You should see the Swagger API documentation

2. **Test the frontend:**
   - Visit `https://your-frontend.vercel.app`
   - Try logging in with your credentials
   - Verify that API calls are working

## 🔧 Troubleshooting

### Backend Issues

1. **Check logs in Railway:**
   - Go to your Railway project
   - Click on the backend service
   - View "Deployments" → Click on latest deployment → View logs

2. **Common issues:**
   - Database connection errors: Verify DATABASE_URL
   - CORS errors: Ensure FRONTEND_URL is set correctly
   - Port issues: Railway automatically sets PORT, don't override

### Frontend Issues

1. **Check build logs in Vercel:**
   - Go to your Vercel project
   - Click on "Deployments"
   - View logs for any errors

2. **Common issues:**
   - API calls failing: Check VITE_API_BASE_URL
   - Build errors: Ensure all dependencies are installed

## 📝 Important Notes

1. **Security**: The environment variables in this guide contain real credentials. In production, you should:
   - Generate new JWT secrets
   - Use app-specific passwords for email
   - Rotate database credentials regularly

2. **Free Tier Limits**:
   - Railway: $5 credit/month (approximately 500 hours of usage)
   - Vercel: Unlimited deployments, but bandwidth limits apply
   - Supabase: 500MB database, 50,000 monthly active users

3. **File Uploads**: The current setup uses local storage for uploads. For production, consider using cloud storage like AWS S3 or Cloudinary.

## 🔄 Updating Your Deployment

After making changes to your code:

```bash
git add .
git commit -m "Your changes"
git push origin main
```

Both Railway and Vercel will automatically detect the changes and redeploy!

## 📧 Support

If you encounter any issues:
1. Check the logs in Railway/Vercel
2. Verify all environment variables are set correctly
3. Ensure your Supabase database is accessible

---

**Built with ❤️ by Aryan Saud and Safal Shyangwa**