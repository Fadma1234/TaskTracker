# Deployment Guide

## Step 1: Deploy Convex Backend to Production

1. **Deploy Convex functions:**
   ```bash
   npx convex deploy
   ```

2. **Get your production Convex URL:**
   After deployment, Convex will give you a production URL. It will look like:
   ```
   https://your-project.convex.cloud
   ```

3. **Save this URL** - you'll need it for Vercel deployment.

## Step 2: Deploy Frontend to Vercel

### Option A: Deploy via Vercel CLI (Recommended)

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy:**
   ```bash
   vercel
   ```
   
   Follow the prompts:
   - Link to existing project? **No** (first time)
   - Project name: **tasktracker** (or your choice)
   - Directory: **./** (current directory)
   - Override settings? **No**

4. **Set Environment Variable:**
   After first deployment, set the Convex URL:
   ```bash
   vercel env add VITE_CONVEX_URL
   ```
   When prompted, enter your production Convex URL from Step 1.

5. **Redeploy with environment variable:**
   ```bash
   vercel --prod
   ```

### Option B: Deploy via Vercel Dashboard

1. **Go to [vercel.com](https://vercel.com)** and sign up/login

2. **Import your GitHub repository:**
   - Click "New Project"
   - Import your `TaskTracker` repository
   - Configure:
     - Framework Preset: **Vite**
     - Root Directory: **./**
     - Build Command: `npm run build`
     - Output Directory: `dist`

3. **Add Environment Variable:**
   - Go to Project Settings → Environment Variables
   - Add: `VITE_CONVEX_URL` = your production Convex URL

4. **Deploy:**
   - Click "Deploy"
   - Wait for deployment to complete
   - Copy your deployment URL

## Step 3: Update README with Live Link

After deployment, update the README.md file:
- Replace the placeholder URL with your actual Vercel deployment URL

## Step 4: Push to GitHub

```bash
git add .
git commit -m "Add deployment configuration and live link"
git push origin feature
```

## Troubleshooting

### If deployment fails:
- Make sure `VITE_CONVEX_URL` is set in Vercel environment variables
- Check that Convex backend is deployed (`npx convex deploy`)
- Verify build works locally: `npm run build`

### If app doesn't connect to backend:
- Check Vercel environment variables are set correctly
- Make sure you're using the **production** Convex URL, not localhost
- Redeploy after changing environment variables
