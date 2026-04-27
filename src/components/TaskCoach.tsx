import { useState } from "react";
import { useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

type TaskCoachInsight = {
  summary: string;
  risks: string[];
  recommendations: string[];
  followUps: Array<{
    employeeName: string;
    employeeEmail: string;
    message: string;
  }>;
  status: AIStatus;
};

type AIStatus = "success" | "timeout" | "parse_error" | "validation_error";

type ErrorState = {
  status: AIStatus;
  message: string;
};

interface TaskCoachProps {
  taskId: Id<"tasks">;
  userEmail: string;
}

export default function TaskCoach({ taskId, userEmail }: TaskCoachProps) {
  const [insight, setInsight] = useState<TaskCoachInsight | null>(null);
  const [error, setError] = useState<ErrorState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const coachTask = useAction(api.ai.coachTask);

  const parseErrorState = (err: any): ErrorState => {
    const message = err?.message ?? "Failed to generate task coaching.";
    if (message.includes("validation_error")) {
      return {
        status: "validation_error",
        message: message.replace("validation_error:", "").trim(),
      };
    }
    if (message.includes("timeout")) {
      return { status: "timeout", message };
    }
    if (message.includes("parse_error")) {
      return { status: "parse_error", message };
    }
    return { status: "parse_error", message };
  };

  const statusBanner = (status: AIStatus, message?: string) => {
    if (status === "success") {
      return (
        <div className="mt-3 rounded-md border border-green-200 bg-green-50 p-2 text-xs text-green-800">
          Task coaching generated successfully.
        </div>
      );
    }

    if (status === "timeout") {
      return (
        <div className="mt-3 rounded-md border border-yellow-200 bg-yellow-50 p-2 text-xs text-yellow-800">
          OpenAI timed out after 10 seconds, so this coaching uses the
          rule-based fallback.
        </div>
      );
    }

    if (status === "parse_error") {
      return (
        <div className="mt-3 rounded-md border border-orange-200 bg-orange-50 p-2 text-xs text-orange-800">
          OpenAI returned invalid JSON after retry, so this coaching uses the
          rule-based fallback.
        </div>
      );
    }

    return (
      <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-700">
        {message || "This task cannot be coached until the task data is valid."}
      </div>
    );
  };

  const handleCoachTask = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await coachTask({ taskId, userEmail });
      setInsight(result);
    } catch (err: any) {
      console.error("Failed to coach task:", err);
      setInsight(null);
      setError(parseErrorState(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-3 rounded-lg border border-purple-100 bg-purple-50 p-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-purple-900">
            AI Task Coach
          </div>
          <p className="text-xs text-purple-800">
            Break this task into next steps and draft a status update.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCoachTask}
            disabled={isLoading}
            className="rounded-md bg-purple-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? "Coaching..." : "Coach Me"}
          </button>
          <span className="group relative inline-flex">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-gray-200 text-xs font-semibold text-gray-600">
              ?
            </span>
            <span className="pointer-events-none absolute right-0 top-7 z-10 hidden w-64 rounded-md bg-gray-900 p-3 text-xs leading-5 text-white shadow-lg group-hover:block">
              AI breaks this task into steps and drafts a status update you can
              send to your manager.
            </span>
          </span>
        </div>
      </div>

      {error && statusBanner(error.status, error.message)}

      {insight && statusBanner(insight.status)}

      {insight && (
        <div className="mt-3 space-y-3 text-sm">
          <p className="text-purple-950">{insight.summary}</p>

          <div>
            <div className="font-medium text-purple-950">Next steps</div>
            <ul className="mt-1 list-disc space-y-1 pl-5 text-purple-900">
              {insight.recommendations.map((recommendation) => (
                <li key={recommendation}>{recommendation}</li>
              ))}
            </ul>
          </div>

          {insight.followUps[0]?.message && (
            <div className="rounded-md bg-white p-2">
              <div className="font-medium text-gray-900">Status draft</div>
              <p className="mt-1 text-gray-700">{insight.followUps[0].message}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
