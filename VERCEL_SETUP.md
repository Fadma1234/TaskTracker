npm# Vercel Deployment Steps

## ✅ Step 1: Connect GitHub Repository

1. Go to https://vercel.com/dashboard
2. Click **"Add New Project"** button
3. You'll see your GitHub repositories listed
4. Find **"TaskTracker"** (or `Fadma1234/TaskTracker`)
5. Click **"Import"** next to it

## ✅ Step 2: Configure Project Settings

After importing, you'll see configuration options:

### Framework Preset
- Select: **Vite** (or it may auto-detect)

### Root Directory
- Leave as: **./** (current directory)

### Build and Output Settings
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm install` (default)

### Environment Variables
**IMPORTANT:** Before deploying, add this environment variable:

1. Click **"Environment Variables"** section
2. Click **"Add"** or **"Add New"**
3. Add:
   - **Name:** `VITE_CONVEX_URL`
   - **Value:** (You'll get this from Convex - see Step 3 below)
   - **Environment:** Select all (Production, Preview, Development)

## ✅ Step 3: Deploy Convex Backend First

**Before deploying to Vercel, you need your Convex production URL:**

1. Open a terminal in your project folder
2. Run:
   ```bash
   npx convex login
   ```
   (This will open browser to login/create Convex account)

3. After logging in, run:
   ```bash
   npx convex deploy
   ```

4. **Copy the production URL** - it will look like:
   ```
   https://your-project-name.convex.cloud
   ```

5. **Go back to Vercel** and paste this URL as the value for `VITE_CONVEX_URL`

## ✅ Step 4: Deploy on Vercel

1. After adding the environment variable, click **"Deploy"**
2. Wait 2-3 minutes for deployment
3. You'll see build logs in real-time
4. When done, you'll see: **"Congratulations! Your project has been deployed"**

## ✅ Step 5: Get Your Live URL

After deployment completes:
1. You'll see your deployment URL, e.g.: `https://tasktracker-xyz123.vercel.app`
2. **Copy this URL** - this is your live link!

## ✅ Step 6: Update README

1. Open `README.md`
2. Find line 7 with: `**🔗 [View Live Application](https://your-project.vercel.app)**`
3. Replace `https://your-project.vercel.app` with your actual Vercel URL
4. Save the file

## ✅ Step 7: Push Updated README to GitHub

```bash
git add README.md
git commit -m "Update README with live Vercel deployment link"
git push origin feature
```

## 🎉 Done!

Your app is now live! Share the Vercel URL with anyone.

---

## Troubleshooting

### If build fails:
- Check that `VITE_CONVEX_URL` is set correctly
- Make sure Convex backend is deployed (`npx convex deploy`)
- Check build logs in Vercel dashboard for errors

### If app doesn't connect to backend:
- Verify `VITE_CONVEX_URL` environment variable is set in Vercel
- Make sure you're using the **production** Convex URL (not localhost)
- Redeploy after fixing environment variables
