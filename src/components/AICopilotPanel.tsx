import { useState } from "react";
import { useAction } from "convex/react";
import { api } from "../../convex/_generated/api";

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

type ErrorState = {
  status: AIStatus;
  message: string;
};

interface AICopilotPanelProps {
  userEmail: string;
  demoMode?: boolean;
  initialInsight?: AIInsight;
}

export default function AICopilotPanel({
  userEmail,
  demoMode = false,
  initialInsight,
}: AICopilotPanelProps) {
  const [insight, setInsight] = useState<AIInsight | null>(
    initialInsight ?? null
  );
  const [error, setError] = useState<ErrorState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [chainStep, setChainStep] = useState<"idle" | "analyzing" | "actions">("idle");
  const generateTeamBrief = useAction(api.ai.generateTeamBrief);

  const parseErrorState = (err: any): ErrorState => {
    const message = err?.message ?? "Failed to generate AI team brief.";
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
        <div className="mt-4 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          AI brief generated successfully.
        </div>
      );
    }

    if (status === "timeout") {
      return (
        <div className="mt-4 rounded-md border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
          <div className="font-semibold">OpenAI timed out after 10 seconds.</div>
          <p className="mt-1">
            Showing the rule-based fallback brief. The timeout was logged to
            `aiInsights`.
          </p>
        </div>
      );
    }

    if (status === "parse_error") {
      return (
        <div className="mt-4 rounded-md border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-800">
          <div className="font-semibold">OpenAI response was not valid JSON.</div>
          <p className="mt-1">
            The app retried once with a stricter JSON-only prompt, then used the
            rule-based fallback. The parse error was logged to `aiInsights`.
          </p>
        </div>
      );
    }

    return (
      <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        <div className="font-semibold">Validation blocked this AI request.</div>
        <p className="mt-1">
          {message ||
            "Add at least one employee and one task before generating a team brief."}
        </p>
      </div>
    );
  };

  const handleGenerateBrief = async () => {
    setIsLoading(true);
    setChainStep("analyzing");
    setError(null);
    const progressTimer = window.setTimeout(() => {
      setChainStep("actions");
    }, 900);

    try {
      if (demoMode && initialInsight) {
        await new Promise((resolve) => window.setTimeout(resolve, 1400));
        setInsight(initialInsight);
        return;
      }

      const result = await generateTeamBrief({ userEmail });
      setInsight(result);
    } catch (err: any) {
      console.error("Failed to generate AI team brief:", err);
      setInsight(null);
      setError(parseErrorState(err));
    } finally {
      window.clearTimeout(progressTimer);
      setChainStep("idle");
      setIsLoading(false);
    }
  };

  return (
    <section className="mb-8 rounded-lg border border-indigo-100 bg-white p-6 shadow-md">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">
            AI Operations Copilot
          </p>
          <h2 className="mt-1 text-2xl font-bold text-gray-900">
            Team execution brief
          </h2>
          <p className="mt-2 max-w-3xl text-sm text-gray-600">
            Generate a manager-ready summary of active work, risks, priorities,
            and employee follow-up drafts. If no LLM key is configured, the app
            uses deterministic workflow rules so the demo still works.
            {demoMode && " Demo Mode is using canned chain output."}
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handleGenerateBrief}
              disabled={isLoading}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading
                ? "Running AI chain..."
                : demoMode
                  ? "Replay Demo Chain"
                  : "Generate Team Brief"}
            </button>
            <span className="group relative inline-flex">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-gray-200 text-xs font-semibold text-gray-600">
                ?
              </span>
              <span className="pointer-events-none absolute right-0 top-7 z-10 hidden w-80 rounded-md bg-gray-900 p-3 text-xs leading-5 text-white shadow-lg group-hover:block">
                Runs a 2-step AI chain: first summarizes your team's task
                status, then generates risk scores, prioritized actions, and
                draft messages for each at-risk employee.
              </span>
            </span>
          </div>
          {isLoading && (
            <div className="rounded-md border border-indigo-100 bg-indigo-50 p-3 text-sm text-indigo-900">
              <div className="flex items-center gap-2">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    chainStep === "analyzing" ? "bg-indigo-600" : "bg-indigo-300"
                  }`}
                />
                <span className={chainStep === "analyzing" ? "font-semibold" : ""}>
                  Analyzing team...
                </span>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    chainStep === "actions" ? "bg-indigo-600" : "bg-indigo-300"
                  }`}
                />
                <span className={chainStep === "actions" ? "font-semibold" : ""}>
                  Generating actions...
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {error && statusBanner(error.status, error.message)}

      {insight && statusBanner(insight.status)}

      {insight && (
        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-lg bg-indigo-50 p-4 lg:col-span-2">
            <h3 className="font-semibold text-indigo-900">
              Step 1: Team status summary
            </h3>
            <p className="mt-2 text-sm text-indigo-900">
              {insight.teamSummary ?? insight.summary}
            </p>
          </div>

          <div className="rounded-lg border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900">
              Step 2: Risk scores
            </h3>
            {insight.riskScores && insight.riskScores.length > 0 ? (
              <ul className="mt-2 space-y-2 text-sm text-gray-700">
                {insight.riskScores.map((risk) => (
                  <li
                    key={`${risk.employeeId}-${risk.reason}`}
                    className="rounded-md bg-red-50 p-2 text-red-800"
                  >
                    <span className="font-semibold">
                      {risk.score}/10 risk
                    </span>{" "}
                    for {risk.employeeId}: {risk.reason}
                  </li>
                ))}
              </ul>
            ) : (
              <ul className="mt-2 space-y-2 text-sm text-gray-700">
                {insight.risks.map((risk) => (
                  <li key={risk} className="rounded-md bg-red-50 p-2 text-red-800">
                    {risk}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-lg border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900">
              Prioritized actions
            </h3>
            <ul className="mt-2 space-y-2 text-sm text-gray-700">
              {(insight.prioritizedActions ?? insight.recommendations).map((recommendation) => (
                <li
                  key={recommendation}
                  className="rounded-md bg-green-50 p-2 text-green-800"
                >
                  {recommendation}
                </li>
              ))}
            </ul>
          </div>

          {insight.followUps.length > 0 && (
            <div className="rounded-lg border border-gray-200 p-4 lg:col-span-2">
              <h3 className="font-semibold text-gray-900">Follow-up drafts</h3>
              <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                {insight.followUps.map((followUp) => (
                  <div
                    key={`${followUp.employeeEmail}-${followUp.message}`}
                    className="rounded-md bg-gray-50 p-3"
                  >
                    <div className="text-sm font-medium text-gray-900">
                      {followUp.employeeName}
                    </div>
                    <div className="text-xs text-gray-500">
                      {followUp.employeeEmail}
                    </div>
                    <p className="mt-2 text-sm text-gray-700">
                      {followUp.message}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
