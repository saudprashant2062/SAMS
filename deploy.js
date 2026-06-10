#!/usr/bin/env node

/**
 * SAMS Automated Deployment Script
 * 
 * This script helps deploy SAMS to Railway (backend) and Vercel (frontend).
 * 
 * Prerequisites:
 * - Railway CLI: npm install -g @railway/cli
 * - Vercel CLI: npm install -g vercel
 * - Git installed and configured
 * 
 * Usage:
 *   node deploy.js [options]
 * 
 * Options:
 *   --backend    Deploy backend to Railway only
 *   --frontend   Deploy frontend to Vercel only
 *   --all        Deploy both backend and frontend (default)
 *   --help       Show this help message
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

function exec(command, options = {}) {
  try {
    return execSync(command, { stdio: 'inherit', ...options });
  } catch (error) {
    console.error(`Error executing: ${command}`);
    throw error;
  }
}

function checkCLIInstalled(name, installCommand) {
  try {
    execSync(`${name} --version`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

async function deployBackend() {
  console.log('\n🚂 Deploying Backend to Railway...\n');
  
  // Check if Railway CLI is installed
  if (!checkCLIInstalled('railway', 'npm install -g @railway/cli')) {
    console.log('⚠️  Railway CLI not found.');
    console.log('Please install it: npm install -g @railway/cli');
    console.log('Or deploy manually at: https://railway.app');
    const install = await question('Do you want to install Railway CLI now? (y/n): ');
    if (install.toLowerCase() === 'y') {
      exec('npm install -g @railway/cli');
    } else {
      console.log('Skipping Railway CLI installation.');
      return;
    }
  }
  
  // Login to Railway
  console.log('Please login to Railway...');
  try {
    exec('railway login');
  } catch (error) {
    console.log('Login failed or cancelled.');
    return;
  }
  
  // Navigate to backend directory
  const backendDir = join(process.cwd(), 'student-attendance-management-system');
  console.log(`\n📁 Working in: ${backendDir}`);
  
  // Initialize Railway project
  console.log('\n🔧 Initializing Railway project...');
  console.log('If prompted, select "Link existing project" or "Create new project"');
  
  try {
    exec('cd student-attendance-management-system && railway init');
  } catch (error) {
    console.log('Note: If project already exists, you may need to link it manually.');
  }
  
  // Set environment variables
  console.log('\n📝 Setting up environment variables...');
  console.log('You will need to add these environment variables in Railway dashboard:');
  console.log('');
  console.log('Required variables:');
  console.log('  NODE_ENV=production');
  console.log('  PORT=5000');
  console.log('  DATABASE_URL=<your-supabase-connection-string>');
  console.log('  ACCESS_TOKEN_SECRET=<your-secret-key>');
  console.log('  ACCESS_TOKEN_EXPIRY=1h');
  console.log('  REFRESH_TOKEN_SECRET=<your-refresh-secret>');
  console.log('  REFRESH_TOKEN_EXPIRY=7d');
  console.log('  EMAIL_HOST=smtp.gmail.com');
  console.log('  EMAIL_PORT=587');
  console.log('  EMAIL_USER=<your-email>');
  console.log('  EMAIL_PASSWORD=<your-app-password>');
  console.log('  FRONTEND_URL=https://your-frontend.vercel.app');
  console.log('  REDIS_HOST=<your-redis-host>');
  console.log('  REDIS_PORT=<your-redis-port>');
  console.log('  REDIS_PASSWORD=<your-redis-password>');
  console.log('');
  
  const setVars = await question('Have you set up the environment variables in Railway? (y/n): ');
  if (setVars.toLowerCase() !== 'y') {
    console.log('Please set up environment variables in Railway dashboard first.');
    console.log('Go to: https://railway.app and navigate to your project variables.');
    return;
  }
  
  // Deploy
  console.log('\n🚀 Deploying to Railway...');
  try {
    exec('cd student-attendance-management-system && railway up');
    console.log('\n✅ Backend deployment initiated!');
    console.log('Check your Railway dashboard for deployment status.');
  } catch (error) {
    console.log('Deployment may have failed. Check Railway dashboard for details.');
  }
}

async function deployFrontend() {
  console.log('\n▲ Deploying Frontend to Vercel...\n');
  
  // Check if Vercel CLI is installed
  if (!checkCLIInstalled('vercel', 'npm install -g vercel')) {
    console.log('⚠️  Vercel CLI not found.');
    console.log('Please install it: npm install -g vercel');
    console.log('Or deploy manually at: https://vercel.com');
    const install = await question('Do you want to install Vercel CLI now? (y/n): ');
    if (install.toLowerCase() === 'y') {
      exec('npm install -g vercel');
    } else {
      console.log('Skipping Vercel CLI installation.');
      return;
    }
  }
  
  // Login to Vercel
  console.log('Please login to Vercel...');
  try {
    exec('vercel login');
  } catch (error) {
    console.log('Login failed or cancelled.');
    return;
  }
  
  // Navigate to frontend directory
  const frontendDir = join(process.cwd(), 'SAMS_FRONTEND');
  console.log(`\n📁 Working in: ${frontendDir}`);
  
  // Deploy
  console.log('\n🚀 Deploying to Vercel...');
  console.log('Follow the prompts to configure your deployment.');
  console.log('');
  console.log('Recommended settings:');
  console.log('  - Root Directory: SAMS_FRONTEND');
  console.log('  - Build Command: npm run build');
  console.log('  - Output Directory: dist');
  console.log('');
  
  try {
    exec('cd SAMS_FRONTEND && vercel --prod');
    console.log('\n✅ Frontend deployed!');
  } catch (error) {
    console.log('Deployment may have failed. Check Vercel dashboard for details.');
  }
  
  // Get the deployment URL
  console.log('\n📝 Important: Add environment variable in Vercel dashboard:');
  console.log('  Name: VITE_API_BASE_URL');
  console.log('  Value: https://your-backend.railway.app/api');
  console.log('');
  console.log('Go to your Vercel project settings to add this.');
}

async function main() {
  const args = process.argv.slice(2);
  const deployBackendOnly = args.includes('--backend');
  const deployFrontendOnly = args.includes('--frontend');
  const showHelp = args.includes('--help') || args.includes('-h');
  
  if (showHelp) {
    console.log(`
SAMS Automated Deployment Script

Usage: node deploy.js [options]

Options:
  --backend    Deploy backend to Railway only
  --frontend   Deploy frontend to Vercel only
  --all        Deploy both backend and frontend (default)
  --help       Show this help message

Prerequisites:
  - Railway CLI: npm install -g @railway/cli
  - Vercel CLI: npm install -g vercel
  - Git installed and configured

Example:
  node deploy.js --all        # Deploy everything
  node deploy.js --backend    # Deploy backend only
  node deploy.js --frontend   # Deploy frontend only
`);
    process.exit(0);
  }
  
  console.log('🎓 SAMS Automated Deployment Script');
  console.log('===================================');
  
  try {
    if (deployFrontendOnly) {
      await deployFrontend();
    } else if (deployBackendOnly) {
      await deployBackend();
    } else {
      // Deploy both
      console.log('\nThis will deploy both backend and frontend.');
      const confirm = await question('Continue? (y/n): ');
      if (confirm.toLowerCase() !== 'y') {
        console.log('Deployment cancelled.');
        process.exit(0);
      }
      
      await deployBackend();
      await deployFrontend();
    }
    
    console.log('\n🎉 Deployment process completed!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Check your Railway and Vercel dashboards for deployment status');
    console.log('2. Update FRONTEND_URL in Railway with your Vercel frontend URL');
    console.log('3. Update VITE_API_BASE_URL in Vercel with your Railway backend URL');
    console.log('4. Test your application!');
    
  } catch (error) {
    console.error('\n❌ Deployment failed with error:', error.message);
    console.log('Please check the error messages above and try again.');
  }
  
  rl.close();
}

main();