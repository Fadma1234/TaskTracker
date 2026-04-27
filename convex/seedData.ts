import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { MutationCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";

const SEEDED_EMPLOYEES = [
  {
    name: "Sarah Chen",
    email: "sarah.chen@tasktracker.test",
  },
  {
    name: "Marcus Johnson",
    email: "marcus.johnson@tasktracker.test",
  },
  {
    name: "Priya Patel",
    email: "priya.patel@tasktracker.test",
  },
  {
    name: "James Wright",
    email: "james.wright@tasktracker.test",
  },
] as const;

const SEEDED_ADMIN = {
  name: "TaskTracker Demo Admin",
  email: "demo.admin@tasktracker.test",
} as const;

const DAY_MS = 24 * 60 * 60 * 1000;

type SeededEmployeeEmail = (typeof SEEDED_EMPLOYEES)[number]["email"];
type TaskStatus = "pending" | "in_progress" | "completed";
type TaskPriority = "low" | "medium" | "high";

type SeedTaskInput = {
  title: string;
  description: string;
  assignedToEmail: SeededEmployeeEmail;
  status: TaskStatus;
  priority: TaskPriority;
  dueOffsetDays: number;
  updatedOffsetDays?: number;
};

const SEEDED_TASKS: SeedTaskInput[] = [
  {
    title: "Q4 Campaign Launch",
    description:
      "Finalize campaign assets and confirm launch checklist with channel owners. This overdue work needs a recovery plan.",
    assignedToEmail: "sarah.chen@tasktracker.test",
    status: "pending",
    priority: "high",
    dueOffsetDays: -2,
  },
  {
    title: "Client Onboarding Deck",
    description:
      "Update the onboarding story, add implementation milestones, and send the revised deck for review.",
    assignedToEmail: "sarah.chen@tasktracker.test",
    status: "in_progress",
    priority: "medium",
    dueOffsetDays: -1,
  },
  {
    title: "Executive Metrics Snapshot",
    description:
      "Pull the latest funnel metrics and summarize variance against plan for leadership.",
    assignedToEmail: "sarah.chen@tasktracker.test",
    status: "pending",
    priority: "medium",
    dueOffsetDays: -1,
  },
  {
    title: "API Integration Review",
    description:
      "Review partner API changes and confirm the rollout path before tomorrow's checkpoint.",
    assignedToEmail: "marcus.johnson@tasktracker.test",
    status: "pending",
    priority: "high",
    dueOffsetDays: 1,
  },
  {
    title: "Security Questionnaire Follow-up",
    description:
      "Collect final answers from engineering and package the response for the enterprise prospect.",
    assignedToEmail: "marcus.johnson@tasktracker.test",
    status: "pending",
    priority: "medium",
    dueOffsetDays: 7,
  },
  {
    title: "Data Quality Audit",
    description:
      "Validate imported account records and flag duplicate or incomplete entries for cleanup.",
    assignedToEmail: "priya.patel@tasktracker.test",
    status: "in_progress",
    priority: "medium",
    dueOffsetDays: 5,
  },
  {
    title: "Support Playbook Refresh",
    description:
      "Revise support escalation steps based on last week's incident review and manager feedback.",
    assignedToEmail: "priya.patel@tasktracker.test",
    status: "in_progress",
    priority: "low",
    dueOffsetDays: 10,
  },
  {
    title: "Renewal Risk Review",
    description:
      "Prepare customer health notes and recommended next actions for the renewal meeting.",
    assignedToEmail: "priya.patel@tasktracker.test",
    status: "pending",
    priority: "high",
    dueOffsetDays: 14,
  },
  {
    title: "Invoice Automation Fix",
    description:
      "Blocked by missing billing API credentials. No owner update has been posted in five days.",
    assignedToEmail: "james.wright@tasktracker.test",
    status: "pending",
    priority: "high",
    dueOffsetDays: 3,
    updatedOffsetDays: -5,
  },
  {
    title: "Warehouse Rollout Checklist",
    description:
      "Confirm operations sign-off and document remaining launch dependencies for the warehouse team.",
    assignedToEmail: "james.wright@tasktracker.test",
    status: "pending",
    priority: "low",
    dueOffsetDays: 12,
  },
];

async function getOrCreateSeededUser(
  ctx: MutationCtx,
  user: { name: string; email: string; role: "admin" | "employee" }
): Promise<Doc<"users">> {
  const existing = await ctx.db
    .query("users")
    .withIndex("email", (q) => q.eq("email", user.email))
    .first();

  if (existing) return existing;

  const userId = await ctx.db.insert("users", {
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: Date.now(),
  });

  const created = await ctx.db.get(userId);
  if (!created) {
    throw new Error(`Failed to create seeded user: ${user.email}`);
  }

  return created;
}

async function getSeededEmployeeIds(
  ctx: MutationCtx
): Promise<Map<SeededEmployeeEmail, Id<"users">>> {
  const employeeIds = new Map<SeededEmployeeEmail, Id<"users">>();

  for (const employee of SEEDED_EMPLOYEES) {
    const seededUser = await getOrCreateSeededUser(ctx, {
      ...employee,
      role: "employee",
    });
    employeeIds.set(employee.email, seededUser._id);
  }

  return employeeIds;
}

export const seedTestData = mutation({
  args: {
    userEmail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const userEmail = args.userEmail;
    const currentUser = userEmail
      ? await ctx.db
          .query("users")
          .withIndex("email", (q) => q.eq("email", userEmail))
          .first()
      : null;

    const seededAdmin = await getOrCreateSeededUser(ctx, {
      ...SEEDED_ADMIN,
      role: "admin",
    });
    const assignedBy =
      currentUser?.role === "admin" ? currentUser._id : seededAdmin._id;
    const employeeIds = await getSeededEmployeeIds(ctx);

    await deleteSeededTasks(ctx, employeeIds);

    for (const task of SEEDED_TASKS) {
      const assignedTo = employeeIds.get(task.assignedToEmail);
      if (!assignedTo) {
        throw new Error(`Missing seeded employee: ${task.assignedToEmail}`);
      }

      const updatedAt = now + (task.updatedOffsetDays ?? 0) * DAY_MS;
      await ctx.db.insert("tasks", {
        title: task.title,
        description: task.description,
        assignedTo,
        assignedBy,
        status: task.status,
        priority: task.priority,
        dueDate: now + task.dueOffsetDays * DAY_MS,
        createdAt: now - 6 * DAY_MS,
        updatedAt,
      });
    }

    return {
      employeesCreated: SEEDED_EMPLOYEES.length,
      tasksCreated: SEEDED_TASKS.length,
    };
  },
});

export const clearTestData = mutation({
  args: {},
  handler: async (ctx) => {
    const employeeIds = new Map<SeededEmployeeEmail, Id<"users">>();

    for (const employee of SEEDED_EMPLOYEES) {
      const existing = await ctx.db
        .query("users")
        .withIndex("email", (q) => q.eq("email", employee.email))
        .first();

      if (existing) {
        employeeIds.set(employee.email, existing._id);
      }
    }

    const deletedTasks = await deleteSeededTasks(ctx, employeeIds);
    let deletedUsers = 0;

    for (const employeeId of employeeIds.values()) {
      await ctx.db.delete(employeeId);
      deletedUsers += 1;
    }

    const admin = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", SEEDED_ADMIN.email))
      .first();

    if (admin) {
      await ctx.db.delete(admin._id);
      deletedUsers += 1;
    }

    return { deletedTasks, deletedUsers };
  },
});

export const hasTestData = query({
  args: {},
  handler: async (ctx) => {
    const sarah = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", SEEDED_EMPLOYEES[0].email))
      .first();

    return sarah !== null;
  },
});

async function deleteSeededTasks(
  ctx: MutationCtx,
  employeeIds: Map<SeededEmployeeEmail, Id<"users">>
): Promise<number> {
  let deletedTasks = 0;

  for (const employeeId of employeeIds.values()) {
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("assignedTo", (q) => q.eq("assignedTo", employeeId))
      .collect();

    for (const task of tasks) {
      if (SEEDED_TASKS.some((seedTask) => seedTask.title === task.title)) {
        await ctx.db.delete(task._id);
        deletedTasks += 1;
      }
    }
  }

  return deletedTasks;
}
