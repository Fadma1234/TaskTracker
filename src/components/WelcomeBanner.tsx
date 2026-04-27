import { useMutation, useQuery } from "convex/react";
import { useState } from "react";

import { api } from "../../convex/_generated/api";

interface WelcomeBannerProps {
  hasNoRealData: boolean;
  userEmail: string;
}

export default function WelcomeBanner({
  hasNoRealData,
  userEmail,
}: WelcomeBannerProps) {
  const [isDismissed, setIsDismissed] = useState(
    () => localStorage.getItem("testDataLoaded") === "true"
  );
  const [isLoading, setIsLoading] = useState(false);
  const hasTestData = useQuery(api.seedData.hasTestData);
  const seedTestData = useMutation(api.seedData.seedTestData);

  const shouldShow =
    hasNoRealData && hasTestData === false && isDismissed === false;

  if (!shouldShow) return null;

  const handleLoadTestData = async () => {
    setIsLoading(true);

    try {
      await seedTestData({ userEmail });
      localStorage.setItem("testDataLoaded", "true");
      setIsDismissed(true);
    } catch (error) {
      console.error("Failed to load test data:", error);
      alert("Failed to load test data");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="mb-8 rounded-lg border border-blue-100 bg-white p-6 shadow-md">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Welcome to TaskTracker AI
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            See how the AI Operations Copilot works with a live team.
          </p>
        </div>
        <div className="flex flex-col items-start gap-2 md:items-end">
          <button
            type="button"
            onClick={handleLoadTestData}
            disabled={isLoading}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? "Loading..." : "Load Test Data"}
          </button>
          <p className="text-xs text-gray-500">
            Loads 4 employees and 10 realistic tasks
          </p>
        </div>
      </div>
    </section>
  );
}
