import { action, internalMutation, internalQuery, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

declare const process: {
  env: Record<string, string | undefined>;
};

type TaskStatus = "pending" | "in_progress" | "completed";
type TaskPriority = "low" | "medium" | "high";

type AIContextTask = {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignedTo: string;
  assignedToEmail: string;
  dueDate?: number;
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
  isOverdue: boolean;
  daysUntilDue?: number;
  daysSinceUpdated: number;
};

type AIInsight = {
  summary: string;
  risks: string[];
  recommendations: string[];
  followUps: Array<{
    employeeName: string;
    employeeEmail: string;
    message: string;
  }>;
  teamSummary?: string;
  riskScores?: Array<{
    employeeId: string;
    score: number;
    reason: string;
  }>;
  prioritizedActions?: string[];
  draftMessages?: Array<{
    employeeId: string;
    message: string;
  }>;
  chainStepOneOutput?: string;
  chainStepTwoOutput?: string;
  status: AIStatus;
  rawResponse?: string;
};

type AIStatus = "success" | "timeout" | "parse_error" | "validation_error";

type OpenAIResult =
  | { status: "success"; insight: AIInsight }
  | { status: "timeout"; rawResponse?: string }
  | { status: "parse_error"; rawResponse?: string };

type OpenAIContentResult =
  | { status: "success"; content: string }
  | { status: "timeout"; rawResponse?: string }
  | { status: "parse_error"; rawResponse?: string };

type ActionPlan = {
  riskScores: Array<{
    employeeId: string;
    score: number;
    reason: string;
  }>;
  prioritizedActions: string[];
  draftMessages: Array<{
    employeeId: string;
    message: string;
  }>;
};

const dayMs = 24 * 60 * 60 * 1000;
const openAITimeoutMs = 10_000;

function debugLog(
  runId: string,
  hypothesisId: string,
  location: string,
  message: string,
  data: Record<string, unknown>
) {
  // #region agent log
  fetch('http://127.0.0.1:7258/ingest/72512225-8bf5-4e09-86ed-f8b7e8f9a1a0',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'ed165d'},body:JSON.stringify({sessionId:'ed165d',runId,hypothesisId,location,message,data,timestamp:Date.now()})}).catch(()=>{});
  // #endregion
}

export const collectAIContext = internalQuery({
  args: {
    userEmail: v.string(),
    now: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", args.userEmail))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const allEmployees = await ctx.db
      .query("users")
      .withIndex("role", (q) => q.eq("role", "employee"))
      .collect();

    const employeeMap = new Map(
      allEmployees.map((employee) => [employee._id, employee])
    );

    const rawTasks =
      user.role === "admin"
        ? await ctx.db.query("tasks").collect()
        : await ctx.db
            .query("tasks")
            .withIndex("assignedTo", (q) => q.eq("assignedTo", user._id))
            .collect();

    const tasks: AIContextTask[] = rawTasks.map((task) => {
      const employee = employeeMap.get(task.assignedTo);
      const daysUntilDue =
        task.dueDate === undefined
          ? undefined
          : Math.ceil((task.dueDate - args.now) / dayMs);

      return {
        id: task._id,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        assignedTo: employee?.name ?? "Unknown employee",
        assignedToEmail: employee?.email ?? "unknown@example.com",
        dueDate: task.dueDate,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
        completedAt: task.completedAt,
        isOverdue:
          task.dueDate !== undefined &&
          task.dueDate < args.now &&
          task.status !== "completed",
        daysUntilDue,
        daysSinceUpdated: Math.floor((args.now - task.updatedAt) / dayMs),
      };
    });

    return {
      currentUser: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      employees: allEmployees.map((employee) => ({
        id: employee._id,
        name: employee.name,
        email: employee.email,
      })),
      tasks,
    };
  },
});

export const saveInsight = internalMutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("aiInsights", args);
  },
});

export const getInsights = internalQuery({
  args: {
    userEmail: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", args.userEmail))
      .first();

    if (!user) return [];

    return await ctx.db
      .query("aiInsights")
      .withIndex("createdBy", (q) => q.eq("createdBy", user._id))
      .order("desc")
      .take(5);
  },
});

export const getDebugInsightEvidence = internalQuery({
  args: {
    userEmail: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", args.userEmail))
      .first();

    if (!user) return [];

    const insights = await ctx.db
      .query("aiInsights")
      .withIndex("createdBy", (q) => q.eq("createdBy", user._id))
      .order("desc")
      .take(5);

    return insights.map((insight) => ({
      type: insight.type,
      status: insight.status,
      createdAt: insight.createdAt,
      rawLength: insight.rawResponse?.length ?? 0,
      rawContainsRiskScores: insight.rawResponse?.includes("riskScores") ?? false,
      rawContainsPrioritizedActions:
        insight.rawResponse?.includes("prioritizedActions") ?? false,
      rawContainsDraftMessages:
        insight.rawResponse?.includes("draftMessages") ?? false,
      chainStepOneLength: insight.chainStepOneOutput?.length ?? 0,
      chainStepTwoLength: insight.chainStepTwoOutput?.length ?? 0,
      hasRiskScores: Boolean(insight.riskScores?.length),
      hasPrioritizedActions: Boolean(insight.prioritizedActions?.length),
      hasDraftMessages: Boolean(insight.draftMessages?.length),
    }));
  },
});

export const getLatestDebugInsightEvidence = query({
  handler: async (ctx) => {
    const insights = await ctx.db.query("aiInsights").order("desc").take(5);

    return insights.map((insight) => ({
      type: insight.type,
      status: insight.status,
      createdAt: insight.createdAt,
      rawLength: insight.rawResponse?.length ?? 0,
      rawContainsRiskScores: insight.rawResponse?.includes("riskScores") ?? false,
      rawContainsPrioritizedActions:
        insight.rawResponse?.includes("prioritizedActions") ?? false,
      rawContainsDraftMessages:
        insight.rawResponse?.includes("draftMessages") ?? false,
      chainStepOneLength: insight.chainStepOneOutput?.length ?? 0,
      chainStepTwoLength: insight.chainStepTwoOutput?.length ?? 0,
      hasRiskScores: Boolean(insight.riskScores?.length),
      hasPrioritizedActions: Boolean(insight.prioritizedActions?.length),
      hasDraftMessages: Boolean(insight.draftMessages?.length),
    }));
  },
});

function buildRuleBasedTeamBrief(tasks: AIContextTask[]): AIInsight {
  const activeTasks = tasks.filter((task) => task.status !== "completed");
  const overdueTasks = activeTasks.filter((task) => task.isOverdue);
  const highPriorityTasks = activeTasks.filter((task) => task.priority === "high");
  const staleTasks = activeTasks.filter((task) => task.daysSinceUpdated >= 3);
  const completedTasks = tasks.filter((task) => task.status === "completed");

  const risks = [
    ...overdueTasks.map(
      (task) =>
        `${task.title} is overdue and assigned to ${task.assignedTo}.`
    ),
    ...staleTasks.map(
      (task) =>
        `${task.title} has not been updated in ${task.daysSinceUpdated} days.`
    ),
    ...highPriorityTasks
      .filter((task) => !task.isOverdue)
      .map(
        (task) =>
          `${task.title} is high priority and currently ${task.status.replace("_", " ")}.`
      ),
  ].slice(0, 6);

  const recommendations = [
    overdueTasks.length > 0
      ? `Start with ${overdueTasks.length} overdue task(s) and ask owners for blockers.`
      : "No overdue work found; keep focus on high-priority active tasks.",
    staleTasks.length > 0
      ? `Request updates on ${staleTasks.length} task(s) without recent movement.`
      : "Task updates look current across the team.",
    highPriorityTasks.length > 0
      ? `Review ${highPriorityTasks.length} high-priority active task(s) in the next standup.`
      : "No high-priority active tasks need escalation right now.",
  ];

  const followUps = activeTasks
    .filter((task) => task.isOverdue || task.daysSinceUpdated >= 3)
    .slice(0, 5)
    .map((task) => ({
      employeeName: task.assignedTo,
      employeeEmail: task.assignedToEmail,
      message:
        `Hi ${task.assignedTo}, quick check on "${task.title}". ` +
        `Can you share the current blocker, the next step, and whether the due date needs to change?`,
    }));

  return {
    summary:
      `The team has ${tasks.length} total task(s), ${activeTasks.length} active, ` +
      `${completedTasks.length} completed, ${overdueTasks.length} overdue, and ` +
      `${highPriorityTasks.length} high-priority active task(s).`,
    risks: risks.length > 0 ? risks : ["No immediate delivery risks detected."],
    recommendations,
    followUps,
    status: "success",
    rawResponse: "Generated with deterministic fallback rules.",
  };
}

function buildRuleBasedTaskCoach(task: AIContextTask): AIInsight {
  const dueText =
    task.daysUntilDue === undefined
      ? "No due date is set, so define a target date before starting."
      : task.daysUntilDue < 0
        ? `This task is ${Math.abs(task.daysUntilDue)} day(s) overdue; confirm the blocker immediately.`
        : `This task is due in ${task.daysUntilDue} day(s); plan the next checkpoint accordingly.`;

  return {
    summary: `Task coach for "${task.title}": ${dueText}`,
    risks: [
      task.priority === "high"
        ? "High-priority task; delays should be surfaced early."
        : "Priority is manageable if progress stays visible.",
      task.daysSinceUpdated >= 3
        ? `No update in ${task.daysSinceUpdated} days; add a progress note.`
        : "Recent update cadence looks healthy.",
    ],
    recommendations: [
      "Restate the expected outcome in one sentence.",
      "Break the work into a research step, execution step, and validation step.",
      "Post a status update with what changed, what is blocked, and the next action.",
    ],
    followUps: [
      {
        employeeName: task.assignedTo,
        employeeEmail: task.assignedToEmail,
        message:
          `For "${task.title}", I will first confirm the expected outcome, ` +
          "then complete the smallest useful next step and update the task status.",
      },
    ],
    status: "success",
    rawResponse: "Generated with deterministic fallback rules.",
  };
}

function buildRuleBasedActionPlan(
  tasks: AIContextTask[],
  employees: Array<{ id: string; name: string; email: string }>
): ActionPlan {
  return {
    riskScores: employees.map((employee) => {
      const employeeTasks = tasks.filter((task) => task.assignedToEmail === employee.email);
      const overdueCount = employeeTasks.filter((task) => task.isOverdue).length;
      const staleCount = employeeTasks.filter((task) => task.daysSinceUpdated >= 3).length;
      const highCount = employeeTasks.filter(
        (task) => task.priority === "high" && task.status !== "completed"
      ).length;
      const score = Math.min(10, Math.max(1, 1 + overdueCount * 3 + staleCount * 2 + highCount * 2));

      return {
        employeeId: employee.id,
        score,
        reason:
          employeeTasks.length === 0
            ? "No assigned tasks, so current delivery risk is low."
            : `${overdueCount} overdue, ${staleCount} stale, and ${highCount} high-priority active task(s).`,
      };
    }),
    prioritizedActions: [
      "Review employees with risk score 7 or higher first.",
      "Ask for blocker updates on overdue or stale tasks.",
      "Confirm owners and next milestones for high-priority active tasks.",
    ],
    draftMessages: tasks
      .filter((task) => task.isOverdue || task.daysSinceUpdated >= 3 || task.priority === "high")
      .slice(0, 5)
      .map((task) => {
        const employee = employees.find((item) => item.email === task.assignedToEmail);
        return {
          employeeId: employee?.id ?? task.assignedToEmail,
          message:
            `Hi ${task.assignedTo}, I noticed "${task.title}" may need attention. ` +
            "Can you share the current status, blocker, and next milestone today?",
        };
      }),
  };
}

function extractJson(content: string): AIInsight | null {
  try {
    const jsonStart = content.indexOf("{");
    const jsonEnd = content.lastIndexOf("}");
    if (jsonStart === -1 || jsonEnd === -1) return null;

    const parsed = JSON.parse(content.slice(jsonStart, jsonEnd + 1));
    return {
      summary: String(parsed.summary ?? ""),
      risks: Array.isArray(parsed.risks) ? parsed.risks.map(String) : [],
      recommendations: Array.isArray(parsed.recommendations)
        ? parsed.recommendations.map(String)
        : [],
      followUps: Array.isArray(parsed.followUps)
        ? parsed.followUps.map((followUp: any) => ({
            employeeName: String(followUp.employeeName ?? "Unknown employee"),
            employeeEmail: String(followUp.employeeEmail ?? "unknown@example.com"),
            message: String(followUp.message ?? ""),
          }))
        : [],
      status: "success",
      rawResponse: content,
    };
  } catch {
    return null;
  }
}

function extractActionPlanJson(content: string): ActionPlan | null {
  try {
    const jsonStart = content.indexOf("{");
    const jsonEnd = content.lastIndexOf("}");
    if (jsonStart === -1 || jsonEnd === -1) return null;

    const parsed = JSON.parse(content.slice(jsonStart, jsonEnd + 1));
    if (
      !Array.isArray(parsed.riskScores) ||
      !Array.isArray(parsed.prioritizedActions) ||
      !Array.isArray(parsed.draftMessages)
    ) {
      return null;
    }

    return {
      riskScores: parsed.riskScores.map((item: any) => ({
        employeeId: String(item.employeeId ?? ""),
        score: Math.min(10, Math.max(1, Number(item.score ?? 1))),
        reason: String(item.reason ?? ""),
      })),
      prioritizedActions: parsed.prioritizedActions.map(String),
      draftMessages: parsed.draftMessages.map((item: any) => ({
        employeeId: String(item.employeeId ?? ""),
        message: String(item.message ?? ""),
      })),
    };
  } catch {
    return null;
  }
}

async function callOpenAIContent(
  prompt: string,
  systemPrompt: string
): Promise<OpenAIContentResult | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), openAITimeoutMs);

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      return {
        status: "parse_error",
        rawResponse: `OpenAI request failed with status ${response.status}`,
      };
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    return typeof content === "string"
      ? { status: "success", content }
      : {
          status: "parse_error",
          rawResponse: "OpenAI response did not include message content.",
        };
  } catch (error: any) {
    if (error?.name === "AbortError") {
      return {
        status: "timeout",
        rawResponse: `OpenAI call exceeded ${openAITimeoutMs}ms.`,
      };
    }

    return {
      status: "parse_error",
      rawResponse: error?.message ?? "OpenAI request failed.",
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function callOpenAIActionPlan(
  prompt: string
): Promise<
  | { status: "success"; actionPlan: ActionPlan; rawResponse: string }
  | { status: "timeout"; rawResponse?: string }
  | { status: "parse_error"; rawResponse?: string }
  | null
> {
  const baseSystemPrompt =
    "You are an AI operations planner. Return JSON with exactly these keys: riskScores, prioritizedActions, draftMessages. riskScores is [{employeeId, score, reason}] where score is 1-10. draftMessages is [{employeeId, message}].";

  const firstAttempt = await callOpenAIContent(prompt, baseSystemPrompt);
  debugLog("initial", "H1,H2,H3,H4", "convex/ai.ts:callOpenAIActionPlan:firstAttempt", "OpenAI action-plan first attempt returned", {
    status: firstAttempt?.status ?? "no_api_key",
    rawLength: firstAttempt?.status === "success" ? firstAttempt.content.length : firstAttempt?.rawResponse?.length ?? 0,
    startsWithJson: firstAttempt?.status === "success" ? firstAttempt.content.trimStart().startsWith("{") : false,
    containsRiskScores: firstAttempt?.status === "success" ? firstAttempt.content.includes("riskScores") : false,
    containsPrioritizedActions: firstAttempt?.status === "success" ? firstAttempt.content.includes("prioritizedActions") : false,
    containsDraftMessages: firstAttempt?.status === "success" ? firstAttempt.content.includes("draftMessages") : false,
  });
  if (!firstAttempt || firstAttempt.status === "timeout") return firstAttempt;

  if (firstAttempt.status === "success") {
    const parsed = extractActionPlanJson(firstAttempt.content);
    debugLog("initial", "H2,H3", "convex/ai.ts:callOpenAIActionPlan:firstParse", "OpenAI action-plan first parse result", {
      parseSucceeded: Boolean(parsed),
      hasOpeningBrace: firstAttempt.content.includes("{"),
      hasClosingBrace: firstAttempt.content.includes("}"),
    });
    if (parsed) {
      return {
        status: "success",
        actionPlan: parsed,
        rawResponse: firstAttempt.content,
      };
    }
  }

  const strictPrompt =
    "Return only valid JSON. No markdown. No explanation. Shape: {\"riskScores\":[{\"employeeId\":\"string\",\"score\":1,\"reason\":\"string\"}],\"prioritizedActions\":[\"string\"],\"draftMessages\":[{\"employeeId\":\"string\",\"message\":\"string\"}]}";

  const retryAttempt = await callOpenAIContent(prompt, strictPrompt);
  debugLog("initial", "H1,H2,H3,H4", "convex/ai.ts:callOpenAIActionPlan:retryAttempt", "OpenAI action-plan retry returned", {
    status: retryAttempt?.status ?? "no_api_key",
    rawLength: retryAttempt?.status === "success" ? retryAttempt.content.length : retryAttempt?.rawResponse?.length ?? 0,
    startsWithJson: retryAttempt?.status === "success" ? retryAttempt.content.trimStart().startsWith("{") : false,
    containsRiskScores: retryAttempt?.status === "success" ? retryAttempt.content.includes("riskScores") : false,
    containsPrioritizedActions: retryAttempt?.status === "success" ? retryAttempt.content.includes("prioritizedActions") : false,
    containsDraftMessages: retryAttempt?.status === "success" ? retryAttempt.content.includes("draftMessages") : false,
  });
  if (!retryAttempt || retryAttempt.status === "timeout") return retryAttempt;

  if (retryAttempt.status === "success") {
    const parsed = extractActionPlanJson(retryAttempt.content);
    debugLog("initial", "H2,H3", "convex/ai.ts:callOpenAIActionPlan:retryParse", "OpenAI action-plan retry parse result", {
      parseSucceeded: Boolean(parsed),
      hasOpeningBrace: retryAttempt.content.includes("{"),
      hasClosingBrace: retryAttempt.content.includes("}"),
    });
    if (parsed) {
      return {
        status: "success",
        actionPlan: parsed,
        rawResponse: retryAttempt.content,
      };
    }
  }

  return {
    status: "parse_error",
    rawResponse:
      (retryAttempt.status === "parse_error" ? retryAttempt.rawResponse : undefined) ??
      (retryAttempt.status === "success" ? retryAttempt.content : undefined) ??
      (firstAttempt.status === "parse_error" ? firstAttempt.rawResponse : undefined) ??
      (firstAttempt.status === "success" ? firstAttempt.content : undefined) ??
      "Action plan response could not be parsed after retry.",
  };
}

async function callOpenAIOnce(
  prompt: string,
  systemPrompt: string
): Promise<OpenAIResult | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), openAITimeoutMs);

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      return {
        status: "parse_error",
        rawResponse: `OpenAI request failed with status ${response.status}`,
      };
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== "string") {
      return {
        status: "parse_error",
        rawResponse: "OpenAI response did not include message content.",
      };
    }

    const parsed = extractJson(content);
    return parsed
      ? { status: "success", insight: parsed }
      : { status: "parse_error", rawResponse: content };
  } catch (error: any) {
    if (error?.name === "AbortError") {
      return {
        status: "timeout",
        rawResponse: `OpenAI call exceeded ${openAITimeoutMs}ms.`,
      };
    }

    return {
      status: "parse_error",
      rawResponse: error?.message ?? "OpenAI request failed.",
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function callOpenAI(prompt: string): Promise<OpenAIResult | null> {
  const baseSystemPrompt =
    "You are an internal AI operations copilot. Return JSON with keys summary, risks, recommendations, followUps. followUps is an array of employeeName, employeeEmail, message.";

  const firstAttempt = await callOpenAIOnce(prompt, baseSystemPrompt);
  if (firstAttempt?.status !== "parse_error") return firstAttempt;

  const strictJsonSystemPrompt =
    "Return only valid JSON. Do not use markdown. Do not include prose outside JSON. The JSON must exactly match this shape: {\"summary\":\"string\",\"risks\":[\"string\"],\"recommendations\":[\"string\"],\"followUps\":[{\"employeeName\":\"string\",\"employeeEmail\":\"string\",\"message\":\"string\"}]}.";

  const retryAttempt = await callOpenAIOnce(prompt, strictJsonSystemPrompt);
  if (retryAttempt?.status === "timeout") return retryAttempt;
  if (retryAttempt?.status === "success") return retryAttempt;

  return {
    status: "parse_error",
    rawResponse:
      retryAttempt?.rawResponse ??
      firstAttempt.rawResponse ??
      "OpenAI response could not be parsed after retry.",
  };
}

export const generateTeamBrief = action({
  args: {
    userEmail: v.string(),
  },
  handler: async (ctx, args): Promise<AIInsight> => {
    const context = await ctx.runQuery(internal.ai.collectAIContext, {
      userEmail: args.userEmail,
      now: Date.now(),
    });

    if (context.currentUser.role !== "admin") {
      throw new Error("Only admins can generate team briefs");
    }

    if (context.employees.length === 0 || context.tasks.length === 0) {
      const validationMessage =
        context.employees.length === 0
          ? "Cannot generate a team brief until the team has at least one employee."
          : "Cannot generate a team brief until at least one task exists.";

      await ctx.runMutation(internal.ai.saveInsight, {
        type: "team_brief",
        summary: validationMessage,
        risks: [validationMessage],
        recommendations: [
          context.employees.length === 0
            ? "Create at least one employee account before running the AI team brief."
            : "Create and assign at least one task before running the AI team brief.",
        ],
        followUps: [],
        status: "validation_error",
        rawResponse: validationMessage,
        createdBy: context.currentUser.id,
        createdAt: Date.now(),
      });

      throw new Error(`validation_error: ${validationMessage}`);
    }

    const fallbackBrief = buildRuleBasedTeamBrief(context.tasks);
    const stepOnePrompt =
      "Summarize this team's task status for a manager. " +
      "Focus on workload, completion, overdue work, stale work, and priority. " +
      `Snapshot: ${JSON.stringify(context)}`;

    const stepOneResult = await callOpenAIContent(
      stepOnePrompt,
      "You summarize internal task tracker data into concise manager-ready prose."
    );
    debugLog("initial", "H5,H4", "convex/ai.ts:generateTeamBrief:stepOne", "Team-summary step completed", {
      status: stepOneResult?.status ?? "no_api_key",
      outputLength: stepOneResult?.status === "success" ? stepOneResult.content.length : stepOneResult?.rawResponse?.length ?? 0,
      taskCount: context.tasks.length,
      employeeCount: context.employees.length,
    });
    const teamSummary =
      stepOneResult?.status === "success" ? stepOneResult.content : fallbackBrief.summary;

    const stepTwoPrompt =
      "Use this team task summary as context, then produce manager actions. " +
      `Team summary: ${teamSummary}\n` +
      `Employees: ${JSON.stringify(context.employees)}\n` +
      `Tasks: ${JSON.stringify(context.tasks)}\n` +
      "Return JSON object with: { riskScores: [{employeeId, score: 1-10, reason}], prioritizedActions: string[], draftMessages: [{employeeId, message}] }";

    const stepTwoResult = await callOpenAIActionPlan(stepTwoPrompt);
    const fallbackActionPlan = buildRuleBasedActionPlan(
      context.tasks,
      context.employees
    );
    const actionPlan =
      stepTwoResult?.status === "success"
        ? stepTwoResult.actionPlan
        : fallbackActionPlan;
    const chainStatus: AIStatus =
      stepOneResult?.status === "timeout" || stepTwoResult?.status === "timeout"
        ? "timeout"
        : stepTwoResult?.status === "parse_error"
          ? "parse_error"
          : "success";
    debugLog("initial", "H1,H2,H3,H4,H5", "convex/ai.ts:generateTeamBrief:chainStatus", "AI chain selected final status", {
      stepOneStatus: stepOneResult?.status ?? "no_api_key",
      stepTwoStatus: stepTwoResult?.status ?? "no_api_key",
      chainStatus,
      usedFallbackActionPlan: stepTwoResult?.status !== "success",
    });

    const employeeById = new Map(
      context.employees.map((employee) => [String(employee.id), employee])
    );
    const aiInsight: AIInsight = {
      summary: teamSummary,
      risks: actionPlan.riskScores
        .filter((risk) => risk.score >= 7)
        .map((risk) => {
          const employee = employeeById.get(risk.employeeId);
          return `${employee?.name ?? risk.employeeId}: ${risk.score}/10 - ${risk.reason}`;
        }),
      recommendations: actionPlan.prioritizedActions,
      followUps: actionPlan.draftMessages.map((draft) => {
        const employee = employeeById.get(draft.employeeId);
        return {
          employeeName: employee?.name ?? draft.employeeId,
          employeeEmail: employee?.email ?? "unknown@example.com",
          message: draft.message,
        };
      }),
      teamSummary,
      riskScores: actionPlan.riskScores,
      prioritizedActions: actionPlan.prioritizedActions,
      draftMessages: actionPlan.draftMessages,
      chainStepOneOutput:
        stepOneResult?.status === "success"
          ? stepOneResult.content
          : stepOneResult?.rawResponse ?? fallbackBrief.summary,
      chainStepTwoOutput:
        stepTwoResult?.status === "success"
          ? stepTwoResult.rawResponse
          : stepTwoResult?.rawResponse ?? JSON.stringify(fallbackActionPlan),
      status: chainStatus,
      rawResponse: JSON.stringify({
        step1: {
          status: stepOneResult?.status ?? "success",
          output:
            stepOneResult?.status === "success"
              ? stepOneResult.content
              : stepOneResult?.rawResponse ?? fallbackBrief.summary,
        },
        step2: {
          status: stepTwoResult?.status ?? "success",
          output:
            stepTwoResult?.status === "success"
              ? stepTwoResult.rawResponse
              : stepTwoResult?.rawResponse ?? JSON.stringify(fallbackActionPlan),
        },
      }),
    };

    await ctx.runMutation(internal.ai.saveInsight, {
      type: "team_brief",
      summary: aiInsight.summary,
      risks: aiInsight.risks,
      recommendations: aiInsight.recommendations,
      followUps: aiInsight.followUps,
      teamSummary: aiInsight.teamSummary,
      riskScores: aiInsight.riskScores,
      prioritizedActions: aiInsight.prioritizedActions,
      draftMessages: aiInsight.draftMessages,
      chainStepOneOutput: aiInsight.chainStepOneOutput,
      chainStepTwoOutput: aiInsight.chainStepTwoOutput,
      status: aiInsight.status,
      rawResponse: aiInsight.rawResponse,
      createdBy: context.currentUser.id,
      createdAt: Date.now(),
    });

    return aiInsight;
  },
});

export const coachTask = action({
  args: {
    userEmail: v.string(),
    taskId: v.string(),
  },
  handler: async (ctx, args): Promise<AIInsight> => {
    const context = await ctx.runQuery(internal.ai.collectAIContext, {
      userEmail: args.userEmail,
      now: Date.now(),
    });

    if (context.employees.length === 0 || context.tasks.length === 0) {
      const validationMessage =
        context.tasks.length === 0
          ? "Cannot coach a task because this user has no assigned tasks."
          : "Cannot coach tasks until the team has at least one employee.";

      await ctx.runMutation(internal.ai.saveInsight, {
        type: "task_coach",
        summary: validationMessage,
        risks: [validationMessage],
        recommendations: [
          context.tasks.length === 0
            ? "Ask an admin to assign a task before using AI task coaching."
            : "Create at least one employee account before using task coaching.",
        ],
        followUps: [],
        status: "validation_error",
        rawResponse: validationMessage,
        createdBy: context.currentUser.id,
        createdAt: Date.now(),
      });

      throw new Error(`validation_error: ${validationMessage}`);
    }

    const task = context.tasks.find((item) => item.id === args.taskId);
    if (!task) {
      const validationMessage = "Task not found or not available to this user.";

      await ctx.runMutation(internal.ai.saveInsight, {
        type: "task_coach",
        summary: validationMessage,
        risks: [validationMessage],
        recommendations: ["Refresh the task list and try task coaching again."],
        followUps: [],
        status: "validation_error",
        rawResponse: validationMessage,
        createdBy: context.currentUser.id,
        createdAt: Date.now(),
      });

      throw new Error(`validation_error: ${validationMessage}`);
    }

    const prompt =
      "Coach an employee through this assigned task. " +
      "Provide clear next steps, risks, and a short status update draft. " +
      `Task: ${JSON.stringify(task)}`;

    const openAIResult = await callOpenAI(prompt);
    let aiInsight: AIInsight;
    if (openAIResult?.status === "success") {
      aiInsight = openAIResult.insight;
    } else {
      const fallbackStatus: AIStatus = openAIResult?.status ?? "success";
      aiInsight = {
        ...buildRuleBasedTaskCoach(task),
        status: fallbackStatus,
        rawResponse:
          openAIResult?.rawResponse ??
          "Generated with deterministic fallback rules because OPENAI_API_KEY is not configured.",
      };
    }

    await ctx.runMutation(internal.ai.saveInsight, {
      type: "task_coach",
      summary: aiInsight.summary,
      risks: aiInsight.risks,
      recommendations: aiInsight.recommendations,
      followUps: aiInsight.followUps,
      status: aiInsight.status,
      rawResponse: aiInsight.rawResponse,
      createdBy: context.currentUser.id,
      createdAt: Date.now(),
    });

    return aiInsight;
  },
});
