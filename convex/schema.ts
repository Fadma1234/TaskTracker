import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.string(),
    role: v.union(v.literal("admin"), v.literal("employee")),
    createdAt: v.number(),
  })
    .index("email", ["email"])
    .index("role", ["role"]),

  tasks: defineTable({
    title: v.string(),
    description: v.string(),
    assignedTo: v.id("users"),
    assignedBy: v.id("users"),
    status: v.union(
      v.literal("pending"),
      v.literal("in_progress"),
      v.literal("completed")
    ),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    dueDate: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
    completedAt: v.optional(v.number()),
  })
    .index("assignedTo", ["assignedTo"])
    .index("assignedBy", ["assignedBy"])
    .index("status", ["status"]),
});
