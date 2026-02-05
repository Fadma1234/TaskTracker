import { query } from "./_generated/server";
import { v } from "convex/values";

export const getAllEmployees = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("users")
      .withIndex("role", (q) => q.eq("role", "employee"))
      .collect();
  },
});

export const getEmployeesByTaskStatus = query({
  args: {
    status: v.union(
      v.literal("pending"),
      v.literal("in_progress"),
      v.literal("completed")
    ),
  },
  handler: async (ctx, args) => {
    const employees = await ctx.db
      .query("users")
      .withIndex("role", (q) => q.eq("role", "employee"))
      .collect();

    const employeesWithTasks = await Promise.all(
      employees.map(async (employee) => {
        const tasks = await ctx.db
          .query("tasks")
          .withIndex("assignedTo", (q) => q.eq("assignedTo", employee._id))
          .filter((q) => q.eq(q.field("status"), args.status))
          .collect();

        return { ...employee, tasks };
      })
    );

    return employeesWithTasks.filter((e) => e.tasks.length > 0);
  },
});

export const getUserProfile = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});

export const getCurrentUser = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    return await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email))
      .first();
  },
});
