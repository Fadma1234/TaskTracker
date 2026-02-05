import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const createTask = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    assignedTo: v.id("users"),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    dueDate: v.optional(v.number()),
    userEmail: v.string(),
  },
  handler: async (ctx, args) => {
    const { userEmail, ...taskData } = args;
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", userEmail))
      .first();

    if (!user || user.role !== "admin") {
      throw new Error("Only admins can create tasks");
    }

    return await ctx.db.insert("tasks", {
      ...taskData,
      assignedBy: user._id,
      status: "pending",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const updateTaskStatus = mutation({
  args: {
    taskId: v.id("tasks"),
    status: v.union(
      v.literal("pending"),
      v.literal("in_progress"),
      v.literal("completed")
    ),
    userEmail: v.string(),
  },
  handler: async (ctx, args) => {
    const { userEmail, ...updateArgs } = args;
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", userEmail))
      .first();

    if (!user) throw new Error("User not found");

    const task = await ctx.db.get(updateArgs.taskId);
    if (!task) throw new Error("Task not found");

    // Only the assigned employee or admin can update status
    if (task.assignedTo !== user._id && user.role !== "admin") {
      throw new Error("Not authorized to update this task");
    }

    const updateData: any = {
      status: updateArgs.status,
      updatedAt: Date.now(),
    };

    if (updateArgs.status === "completed") {
      updateData.completedAt = Date.now();
    }

    await ctx.db.patch(updateArgs.taskId, updateData);
    return updateArgs.taskId;
  },
});

export const assignTask = mutation({
  args: {
    taskId: v.id("tasks"),
    assignedTo: v.id("users"),
    userEmail: v.string(),
  },
  handler: async (ctx, args) => {
    const { userEmail, ...assignData } = args;
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", userEmail))
      .first();

    if (!user || user.role !== "admin") {
      throw new Error("Only admins can assign tasks");
    }

    await ctx.db.patch(assignData.taskId, {
      assignedTo: assignData.assignedTo,
      updatedAt: Date.now(),
    });
    return assignData.taskId;
  },
});

export const getTasks = query({
  args: { userEmail: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", args.userEmail))
      .first();

    if (!user) return [];

    // Admins see all tasks, employees see only their tasks
    if (user.role === "admin") {
      return await ctx.db.query("tasks").collect();
    } else {
      return await ctx.db
        .query("tasks")
        .withIndex("assignedTo", (q) => q.eq("assignedTo", user._id))
        .collect();
    }
  },
});

export const getTaskById = query({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.taskId);
  },
});

export const deleteTask = mutation({
  args: { taskId: v.id("tasks"), userEmail: v.string() },
  handler: async (ctx, args) => {
    const { userEmail, taskId } = args;
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", userEmail))
      .first();

    if (!user || user.role !== "admin") {
      throw new Error("Only admins can delete tasks");
    }

    await ctx.db.delete(taskId);
    return taskId;
  },
});

export const updateTask = mutation({
  args: {
    taskId: v.id("tasks"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    priority: v.optional(
      v.union(v.literal("low"), v.literal("medium"), v.literal("high"))
    ),
    dueDate: v.optional(v.number()),
    userEmail: v.string(),
  },
  handler: async (ctx, args) => {
    const { userEmail, taskId, ...updateData } = args;
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", userEmail))
      .first();

    if (!user || user.role !== "admin") {
      throw new Error("Only admins can update tasks");
    }

    await ctx.db.patch(taskId, {
      ...updateData,
      updatedAt: Date.now(),
    });
    return taskId;
  },
});
