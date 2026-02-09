# Quick Deployment Guide

## ✅ Step 1: Deploy Convex Backend (REQUIRED FIRST)

Run these commands in your terminal:

```bash
cd c:\Users\fadma\TaskTracker
npx convex login
npx convex deploy
```

**What happens:**
- `npx convex login` - Opens browser to login/create Convex account
- `npx convex deploy` - Deploys your backend and gives you a production URL

**Save the production URL** - it will look like: `https://your-project.convex.cloud`

## ✅ Step 2: Deploy to Vercel

### Option A: Via Vercel Website (Easiest)

1. Go to https://vercel.com and sign up/login (use GitHub)
2. Click "Add New Project"
3. Import your GitHub repository: `Fadma1234/TaskTracker`
4. Configure:
   - Framework: **Vite**
   - Root Directory: `./`
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. **Add Environment Variable:**
   - Name: `VITE_CONVEX_URL`
   - Value: (paste your Convex production URL from Step 1)
6. Click "Deploy"
7. Wait for deployment (2-3 minutes)
8. Copy your deployment URL (e.g., `https://tasktracker-xyz.vercel.app`)

### Option B: Via Vercel CLI

```bash
npm i -g vercel
vercel login
vercel
```

When prompted:
- Link to existing project? **No**
- Project name: **tasktracker**
- Directory: **./**
- Override settings? **No**

Then add environment variable:
```bash
vercel env add VITE_CONVEX_URL
```
Enter your Convex production URL when prompted.

Deploy to production:
```bash
vercel --prod
```

## ✅ Step 3: Update README with Live Link

After you get your Vercel URL, update `README.md`:
- Replace the placeholder URL with your actual Vercel deployment URL

## ✅ Step 4: Push to GitHub

```bash
git add .
git commit -m "Update README with live deployment link"
git push origin feature
```

## 🎉 Done!

Your app will be live at: `https://your-project.vercel.app`
