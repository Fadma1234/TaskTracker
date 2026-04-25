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

  aiInsights: defineTable({
    type: v.union(
      v.literal("team_brief"),
      v.literal("follow_up"),
      v.literal("task_coach")
    ),
    summary: v.string(),
    risks: v.array(v.string()),
    recommendations: v.array(v.string()),
    followUps: v.array(
      v.object({
        employeeName: v.string(),
        employeeEmail: v.string(),
        message: v.string(),
      })
    ),
    teamSummary: v.optional(v.string()),
    riskScores: v.optional(
      v.array(
        v.object({
          employeeId: v.string(),
          score: v.number(),
          reason: v.string(),
        })
      )
    ),
    prioritizedActions: v.optional(v.array(v.string())),
    draftMessages: v.optional(
      v.array(
        v.object({
          employeeId: v.string(),
          message: v.string(),
        })
      )
    ),
    chainStepOneOutput: v.optional(v.string()),
    chainStepTwoOutput: v.optional(v.string()),
    status: v.union(
      v.literal("success"),
      v.literal("timeout"),
      v.literal("parse_error"),
      v.literal("validation_error")
    ),
    rawResponse: v.optional(v.string()),
    createdBy: v.id("users"),
    createdAt: v.number(),
  })
    .index("createdBy", ["createdBy"])
    .index("type", ["type"]),
});
