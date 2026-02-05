# Troubleshooting Guide - Can't Create Account

## Your `.env.local` file looks correct! ✅

Your `.env.local` file has:
```
VITE_CONVEX_URL=http://127.0.0.1:3210
```

This is correct. The issue is likely that **Convex dev server isn't running**.

## Step-by-Step Fix:

### 1. **Make sure Convex dev server is running**

Open a **new terminal window** and run:
```bash
cd c:\Users\fadma\TaskTracker
npx convex dev
```

**What to look for:**
- You should see: `Convex dev server running at http://127.0.0.1:3210`
- Keep this terminal window open (don't close it!)
- If you see errors, share them

### 2. **Restart your Vite dev server**

If your frontend is already running:
1. Stop it (Ctrl+C)
2. Start it again:
```bash
npm run dev
```

**Why?** Vite needs to be restarted to pick up `.env.local` changes.

### 3. **Check the browser console**

1. Open your browser
2. Press `F12` to open Developer Tools
3. Go to the "Console" tab
4. Look for any error messages
5. Look for: `"Convex URL from env: http://127.0.0.1:3210"`

### 4. **Check the login page status**

On the login page, you should see one of these:
- 🔄 **Checking backend connection...** (wait a moment)
- ⚠️ **Backend not connected** (Convex dev isn't running)
- ✓ **Backend connected and ready** (everything is working!)

## Common Issues:

### Issue: "Cannot connect to backend"
**Solution:** Make sure `npx convex dev` is running in a terminal

### Issue: "Missing VITE_CONVEX_URL"
**Solution:** 
1. Make sure `.env.local` exists in the project root
2. Restart `npm run dev`
3. Check that `.env.local` has `VITE_CONVEX_URL=http://127.0.0.1:3210`

### Issue: "Network error" or "Failed to fetch"
**Solution:**
- Convex dev server isn't running
- Port 3210 is blocked
- Firewall is blocking the connection

### Issue: Still can't create account after everything is running
**Solution:**
1. Check browser console (F12) for specific error
2. Check the terminal running `npx convex dev` for errors
3. Try refreshing the page
4. Clear browser cache and try again

## Quick Test:

1. Open terminal 1:
   ```bash
   npx convex dev
   ```
   Wait for: `Convex dev server running at http://127.0.0.1:3210`

2. Open terminal 2:
   ```bash
   npm run dev
   ```
   Wait for: `Local: http://localhost:5173`

3. Open browser to `http://localhost:5173`
4. Check login page - should show "✓ Backend connected and ready"
5. Try creating an account

## Still Having Issues?

Share:
1. What error message you see on the login page
2. What's in the browser console (F12)
3. What's showing in the terminal running `npx convex dev`
