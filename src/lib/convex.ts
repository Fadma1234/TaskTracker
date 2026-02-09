import { ConvexReactClient } from "convex/react";

const convexUrl = (import.meta as any).env?.VITE_CONVEX_URL as string | undefined;

if (!convexUrl) {
  console.error(
    "Missing VITE_CONVEX_URL environment variable. " +
    "Please run 'npx convex dev' to set up your Convex backend."
  );
}

export const convex = new ConvexReactClient(
  convexUrl || "https://placeholder.convex.cloud"
);