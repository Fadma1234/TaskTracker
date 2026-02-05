# Quick Deployment Guide - Get Your Live Link

## 🚀 Quick Steps to Deploy

### Step 1: Deploy Convex Backend (2 minutes)

1. **Login to Convex:**
   ```bash
   npx convex login
   ```
   This will open your browser to authenticate.

2. **Deploy Convex:**
   ```bash
   npx convex deploy --prod
   ```
   
3. **Copy your Production Convex URL:**
   After deployment, you'll see something like:
   ```
   Production URL: https://your-project-name.convex.cloud
   ```
   **SAVE THIS URL** - you'll need it for Vercel!

### Step 2: Deploy to Vercel (5 minutes)

#### Option A: Using Vercel Website (Easiest)

1. **Go to [vercel.com](https://vercel.com)**
   - Sign up/Login with GitHub

2. **Click "Add New Project"**

3. **Import your GitHub repository:**
   - Find `Fadma1234/TaskTracker`
   - Click "Import"

4. **Configure Project:**
   - Framework Preset: **Vite** (should auto-detect)
   - Root Directory: **./** (leave default)
   - Build Command: `npm run build` (should be auto-filled)
   - Output Directory: `dist` (should be auto-filled)

5. **Add Environment Variable:**
   - Scroll down to "Environment Variables"
   - Click "Add"
   - Name: `VITE_CONVEX_URL`
   - Value: Paste your production Convex URL from Step 1
   - Click "Add"

6. **Deploy:**
   - Click "Deploy" button
   - Wait 2-3 minutes for deployment

7. **Get Your Live Link:**
   - After deployment completes, you'll see:
   - **Your live URL:** `https://tasktracker-xxxxx.vercel.app`
   - Copy this URL!

#### Option B: Using Vercel CLI

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Login:**
   ```bash
   vercel login
   ```

3. **Deploy:**
   ```bash
   vercel
   ```
   - Link to existing project? **No**
   - Project name: **tasktracker**
   - Directory: **./**

4. **Add Environment Variable:**
   ```bash
   vercel env add VITE_CONVEX_URL production
   ```
   - When prompted, paste your Convex production URL

5. **Deploy to Production:**
   ```bash
   vercel --prod
   ```

6. **Get Your Live Link:**
   - The command will output your deployment URL
   - Or check: `vercel ls` to see all deployments

### Step 3: Update README with Live Link

1. **Edit README.md:**
   - Find the line: `**🔗 Live Application:** [Deploying...](#deployment-instructions)`
   - Replace with: `**🔗 [View Live Application](YOUR_VERCEL_URL_HERE)`**

2. **Commit and Push:**
   ```bash
   git add README.md
   git commit -m "Add live deployment link"
   git push origin feature
   ```

## ✅ You're Done!

Your app is now live! Share your Vercel URL with anyone.

## 🔧 Troubleshooting

### If Vercel build fails:
- Make sure `VITE_CONVEX_URL` environment variable is set
- Check that Convex is deployed (`npx convex deploy --prod`)
- Verify build works locally: `npm run build`

### If app shows "Backend not connected":
- Double-check `VITE_CONVEX_URL` in Vercel settings
- Make sure you're using **production** Convex URL, not localhost
- Redeploy after adding environment variable

### Need Help?
- Check `DEPLOYMENT.md` for detailed instructions
- Check `TROUBLESHOOTING.md` for common issues
