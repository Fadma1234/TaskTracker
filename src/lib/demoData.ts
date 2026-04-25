import { Id } from "../../convex/_generated/dataModel";

const now = Date.now();
const dayMs = 24 * 60 * 60 * 1000;

export type DemoEmployee = {
  _id: Id<"users">;
  name: string;
  email: string;
  role: "employee";
  createdAt: number;
};

export type DemoTask = {
  _id: Id<"tasks">;
  title: string;
  description: string;
  assignedTo: Id<"users">;
  assignedBy: Id<"users">;
  status: "pending" | "in_progress" | "completed";
  priority: "low" | "medium" | "high";
  dueDate?: number;
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
};

export const demoAdminId = "demo_admin" as Id<"users">;

export const demoEmployees: DemoEmployee[] = [
  {
    _id: "demo_user_ava" as Id<"users">,
    name: "Ava Chen",
    email: "ava.chen@company.com",
    role: "employee",
    createdAt: now - 30 * dayMs,
  },
  {
    _id: "demo_user_marcus" as Id<"users">,
    name: "Marcus Johnson",
    email: "marcus.johnson@company.com",
    role: "employee",
    createdAt: now - 28 * dayMs,
  },
  {
    _id: "demo_user_sofia" as Id<"users">,
    name: "Sofia Patel",
    email: "sofia.patel@company.com",
    role: "employee",
    createdAt: now - 21 * dayMs,
  },
];

export const demoTasks: DemoTask[] = [
  {
    _id: "demo_task_security" as Id<"tasks">,
    title: "Complete security access review",
    description:
      "Audit employee permissions, flag stale access, and submit a remediation list to IT.",
    assignedTo: demoEmployees[0]._id,
    assignedBy: demoAdminId,
    status: "in_progress",
    priority: "high",
    dueDate: now - dayMs,
    createdAt: now - 9 * dayMs,
    updatedAt: now - 4 * dayMs,
  },
  {
    _id: "demo_task_onboarding" as Id<"tasks">,
    title: "Draft onboarding checklist",
    description:
      "Create a standardized checklist for new operations hires with owners and due dates.",
    assignedTo: demoEmployees[1]._id,
    assignedBy: demoAdminId,
    status: "pending",
    priority: "medium",
    dueDate: now + 2 * dayMs,
    createdAt: now - 5 * dayMs,
    updatedAt: now - 5 * dayMs,
  },
  {
    _id: "demo_task_qbr" as Id<"tasks">,
    title: "Prepare QBR task completion report",
    description:
      "Summarize completed tasks, cycle time, overdue work, and follow-up items for leadership.",
    assignedTo: demoEmployees[2]._id,
    assignedBy: demoAdminId,
    status: "completed",
    priority: "low",
    dueDate: now + 4 * dayMs,
    createdAt: now - 6 * dayMs,
    updatedAt: now - dayMs,
    completedAt: now - dayMs,
  },
  {
    _id: "demo_task_docs" as Id<"tasks">,
    title: "Update incident response documentation",
    description:
      "Refresh escalation paths, owners, and response-time expectations after the latest process review.",
    assignedTo: demoEmployees[0]._id,
    assignedBy: demoAdminId,
    status: "pending",
    priority: "high",
    dueDate: now + dayMs,
    createdAt: now - 7 * dayMs,
    updatedAt: now - 6 * dayMs,
  },
];

export const demoStats = {
  pending: demoTasks.filter((task) => task.status === "pending").length,
  in_progress: demoTasks.filter((task) => task.status === "in_progress").length,
  completed: demoTasks.filter((task) => task.status === "completed").length,
  total: demoTasks.length,
};

export const demoEmployeeSummaries = demoEmployees.map((employee) => {
  const tasks = demoTasks.filter((task) => task.assignedTo === employee._id);
  return {
    employee,
    totalTasks: tasks.length,
    pendingTasks: tasks.filter((task) => task.status === "pending").length,
    inProgressTasks: tasks.filter((task) => task.status === "in_progress").length,
    completedTasks: tasks.filter((task) => task.status === "completed").length,
  };
});

export const demoAIInsight = {
  summary:
    "The team has four tracked tasks. Two are pending, one is in progress, and one is complete. The biggest delivery risk is Ava's overdue security review plus a second high-priority documentation task with no recent update.",
  risks: [
    "Ava Chen: 9/10 - owns one overdue high-priority task and one stale high-priority task.",
    "Marcus Johnson: 5/10 - onboarding checklist has not moved since creation.",
  ],
  recommendations: [
    "Ask Ava for blockers on the security access review before end of day.",
    "Move the incident response documentation into in-progress or reassign it.",
    "Have Marcus confirm whether the onboarding checklist needs examples from HR.",
  ],
  followUps: [
    {
      employeeName: "Ava Chen",
      employeeEmail: "ava.chen@company.com",
      message:
        "Hi Ava, I noticed the security access review is overdue and the incident response docs are also high priority. Can you share the current blocker, next step, and whether you need help today?",
    },
    {
      employeeName: "Marcus Johnson",
      employeeEmail: "marcus.johnson@company.com",
      message:
        "Hi Marcus, quick check on the onboarding checklist. Can you confirm the first draft owner, what is left, and whether HR input is needed?",
    },
  ],
  teamSummary:
    "Step 1 output: Ava is carrying the highest-risk work because one high-priority task is overdue and another has been stale for six days. Marcus has a medium-priority task that has not started. Sofia completed the reporting task and has no active blockers.",
  riskScores: [
    {
      employeeId: "demo_user_ava",
      score: 9,
      reason:
        "One overdue high-priority task and another high-priority task with no recent update.",
    },
    {
      employeeId: "demo_user_marcus",
      score: 5,
      reason: "Pending onboarding work has not moved since it was created.",
    },
    {
      employeeId: "demo_user_sofia",
      score: 1,
      reason: "Assigned reporting work is complete and no active blockers are present.",
    },
  ],
  prioritizedActions: [
    "Escalate Ava's overdue security review and ask for a blocker update.",
    "Confirm whether Ava needs support or reassignment for incident response documentation.",
    "Ask Marcus for a concrete first draft milestone for onboarding documentation.",
  ],
  draftMessages: [
    {
      employeeId: "demo_user_ava",
      message:
        "Hi Ava, can you send a quick update on the overdue security review and the incident response docs? Please include the blocker, next step, and any support you need.",
    },
    {
      employeeId: "demo_user_marcus",
      message:
        "Hi Marcus, can you share the next milestone for the onboarding checklist and whether you need input from HR or Ops?",
    },
  ],
  chainStepOneOutput:
    "Ava owns the most urgent risk: one overdue high-priority task and another stale high-priority task. Marcus has a pending medium-priority documentation task. Sofia has completed her assigned report.",
  chainStepTwoOutput:
    "{\"riskScores\":[{\"employeeId\":\"demo_user_ava\",\"score\":9,\"reason\":\"One overdue high-priority task and another stale high-priority task.\"},{\"employeeId\":\"demo_user_marcus\",\"score\":5,\"reason\":\"Pending task has not moved since creation.\"},{\"employeeId\":\"demo_user_sofia\",\"score\":1,\"reason\":\"Assigned work is complete.\"}],\"prioritizedActions\":[\"Escalate Ava's overdue security review.\",\"Confirm support needs for incident docs.\",\"Ask Marcus for a first draft milestone.\"],\"draftMessages\":[{\"employeeId\":\"demo_user_ava\",\"message\":\"Hi Ava, can you send a quick update on the overdue security review and incident docs?\"}]}",
  status: "success" as const,
  rawResponse: "Canned demo-mode AI response.",
};

export const demoTaskCoachInsight = {
  summary:
    "Demo coach: Start by confirming the expected outcome, then complete the smallest visible next step and post a status update.",
  recommendations: [
    "Clarify the acceptance criteria in one sentence.",
    "Break the work into research, execution, and validation steps.",
    "Post a blocker update if the next step cannot be completed today.",
  ],
  statusDraft:
    "I confirmed the expected outcome, identified the next milestone, and will update the task after completing the first validation step.",
};
