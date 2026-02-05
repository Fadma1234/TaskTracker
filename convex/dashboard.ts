import { query } from "./_generated/server";
import { v } from "convex/values";

export const getTaskStats = query({
  args: { userEmail: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", args.userEmail))
      .first();

    if (!user) {
      return {
        pending: 0,
        in_progress: 0,
        completed: 0,
        total: 0,
      };
    }

    let tasks;
    if (user.role === "admin") {
      tasks = await ctx.db.query("tasks").collect();
    } else {
      tasks = await ctx.db
        .query("tasks")
        .withIndex("assignedTo", (q) => q.eq("assignedTo", user._id))
        .collect();
    }

    const stats = {
      pending: tasks.filter((t) => t.status === "pending").length,
      in_progress: tasks.filter((t) => t.status === "in_progress").length,
      completed: tasks.filter((t) => t.status === "completed").length,
      total: tasks.length,
    };

    return stats;
  },
});

export const getEmployeeTaskSummary = query({
  args: { userEmail: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", args.userEmail))
      .first();

    if (!user || user.role !== "admin") {
      return [];
    }

    const employees = await ctx.db
      .query("users")
      .withIndex("role", (q) => q.eq("role", "employee"))
      .collect();

    const summaries = await Promise.all(
      employees.map(async (employee) => {
        const tasks = await ctx.db
          .query("tasks")
          .withIndex("assignedTo", (q) => q.eq("assignedTo", employee._id))
          .collect();

        return {
          employee,
          totalTasks: tasks.length,
          pendingTasks: tasks.filter((t) => t.status === "pending").length,
          inProgressTasks: tasks.filter((t) => t.status === "in_progress")
            .length,
          completedTasks: tasks.filter((t) => t.status === "completed").length,
        };
      })
    );

    return summaries;
  },
});
