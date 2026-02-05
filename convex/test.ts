import { query } from "./_generated/server";

// Simple test query to verify Convex is working
export const testConnection = query({
  handler: async (ctx) => {
    return {
      status: "connected",
      timestamp: Date.now(),
      message: "Convex backend is working!",
    };
  },
});
