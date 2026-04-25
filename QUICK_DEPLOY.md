# Quick Deployment Guide

## Step 1: Deploy Convex

```bash
cd c:\Users\fadma\TaskTracker
npx convex login
npx convex deploy
```

Save the production URL from the output, for example:

```text
https://your-project.convex.cloud
```

## Step 2: Configure AI in Convex

```bash
npx convex env set OPENAI_API_KEY your_openai_key
npx convex env set OPENAI_MODEL gpt-4o-mini
```

The app still works without `OPENAI_API_KEY`; it falls back to deterministic workflow analysis.

## Step 3: Deploy to Vercel

In the Vercel dashboard:

1. Import `Fadma1234/TaskTracker`.
2. Use framework preset `Vite`.
3. Set build command to `npm run build`.
4. Set output directory to `dist`.
5. Add `VITE_CONVEX_URL` with your production Convex URL.
6. Deploy.

## Step 4: Add Live Link

After Vercel deploys:

1. Copy the Vercel URL.
2. Add it to the GitHub repository About section.
3. Replace the live demo placeholder in `README.md`.
4. Commit and push.
