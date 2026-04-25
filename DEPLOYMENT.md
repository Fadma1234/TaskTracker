# Deployment Guide

This app has two deployed parts:

- Convex for the database, real-time functions, and server-side AI actions.
- Vercel for the React/Vite frontend.

## 1. Deploy Convex

```bash
npx convex login
npx convex deploy
```

Copy the production Convex URL from the deploy output. It should look like:

```text
https://your-project.convex.cloud
```

## 2. Configure AI Environment Variables in Convex

The OpenAI key must stay server-side in Convex, not in Vite or Vercel browser env vars.

```bash
npx convex env set OPENAI_API_KEY your_openai_key
npx convex env set OPENAI_MODEL gpt-4o-mini
```

`OPENAI_MODEL` is optional. If `OPENAI_API_KEY` is not configured, the app uses deterministic workflow rules so the AI demo still works.

## 3. Deploy Frontend to Vercel

In Vercel:

- Framework preset: `Vite`
- Build command: `npm run build`
- Output directory: `dist`
- Install command: `npm install`

Add this Vercel environment variable:

```text
VITE_CONVEX_URL=https://your-project.convex.cloud
```

Then deploy or redeploy the project.

## 4. Update GitHub About and README

After Vercel deploys, copy the live Vercel URL and:

- Add it to the GitHub repository About section as the website.
- Replace the placeholder live demo URL in `README.md`.

## Troubleshooting

- If the frontend says Convex is not configured, verify `VITE_CONVEX_URL` is set in Vercel and redeploy.
- If AI output is too generic, verify `OPENAI_API_KEY` is set in Convex.
- If the build fails, run `npm run build` locally and check TypeScript errors.
