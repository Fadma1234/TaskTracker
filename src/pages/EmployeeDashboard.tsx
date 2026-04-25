import { useQuery, useMutation } from "convex/react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import Dashboard from "../components/Dashboard";
import TaskCard from "../components/TaskCard";
import StatusFilter from "../components/StatusFilter";
import TaskCoach from "../components/TaskCoach";
import {
  demoEmployees,
  demoStats,
  demoTaskCoachInsight,
  demoTasks,
} from "../lib/demoData";

function DemoBadge() {
  return (
    <div className="fixed bottom-4 right-4 z-50 rounded-full bg-orange-500 px-4 py-2 text-sm font-bold uppercase tracking-wide text-white shadow-lg">
      Demo
    </div>
  );
}

export default function EmployeeDashboard() {
  const [demoMode, setDemoMode] = useState(
    () => localStorage.getItem("demoMode") === "true"
  );

  const toggleDemoMode = () => {
    setDemoMode((current) => {
      const next = !current;
      localStorage.setItem("demoMode", String(next));
      return next;
    });
  };

  if (demoMode) {
    return <DemoEmployeeDashboard onToggleDemo={toggleDemoMode} />;
  }

  return <LiveEmployeeDashboard onToggleDemo={toggleDemoMode} />;
}

function LiveEmployeeDashboard({ onToggleDemo }: { onToggleDemo: () => void }) {
  const navigate = useNavigate();
  const [selectedStatus, setSelectedStatus] = useState<
    "all" | "pending" | "in_progress" | "completed"
  >("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Get current user email from localStorage (demo auth)
  const userEmail = localStorage.getItem("userEmail") || "";

  const currentUser = useQuery(api.auth.getCurrentUser, { email: userEmail });
  const stats = useQuery(api.dashboard.getTaskStats, { userEmail });
  const tasks = useQuery(api.tasks.getTasks, { userEmail });

  const updateTaskStatus = useMutation(api.tasks.updateTaskStatus);

  const handleLogout = () => {
    localStorage.removeItem("userEmail");
    navigate("/login");
  };

  const handleStatusChange = async (
    taskId: Id<"tasks">,
    status: "pending" | "in_progress" | "completed"
  ) => {
    try {
      await updateTaskStatus({ taskId, status, userEmail });
    } catch (error) {
      console.error("Failed to update task status:", error);
      alert("Failed to update task status");
    }
  };

  // Filter tasks
  const filteredTasks = tasks?.filter((task) => {
    if (selectedStatus !== "all" && task.status !== selectedStatus) {
      return false;
    }
    if (
      searchQuery &&
      !task.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !task.description.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  if (!userEmail || currentUser === undefined || stats === undefined || tasks === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!currentUser || currentUser.role !== "employee") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-red-600">Access denied. Employee only.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">My Tasks</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-700">
                Welcome, {currentUser.name}
              </span>
              <button
                onClick={onToggleDemo}
                className="px-4 py-2 text-sm font-medium text-orange-700 bg-orange-100 rounded-md hover:bg-orange-200"
              >
                Demo Mode
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm text-white bg-red-600 rounded-md hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Dashboard stats={stats} />

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">My Tasks</h2>
        </div>

        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <StatusFilter
            selectedStatus={selectedStatus}
            onStatusChange={setSelectedStatus}
          />
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <input
              id="search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks..."
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTasks && filteredTasks.length > 0 ? (
            filteredTasks.map((task) => (
              <div key={task._id}>
                <TaskCard
                  task={task}
                  onStatusChange={handleStatusChange}
                  canEdit={false}
                />
                <TaskCoach taskId={task._id} userEmail={userEmail} />
              </div>
            ))
          ) : (
            <div className="col-span-full text-center text-gray-500 py-8">
              No tasks assigned to you yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DemoTaskCoachCard() {
  return (
    <div className="mt-3 rounded-lg border border-purple-100 bg-purple-50 p-3">
      <div className="text-sm font-semibold text-purple-900">AI Task Coach</div>
      <p className="mt-1 text-xs text-purple-800">
        Demo Mode uses canned coaching output. No API key or database is needed.
      </p>
      <div className="mt-3 space-y-3 text-sm">
        <p className="text-purple-950">{demoTaskCoachInsight.summary}</p>
        <div>
          <div className="font-medium text-purple-950">Next steps</div>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-purple-900">
            {demoTaskCoachInsight.recommendations.map((recommendation) => (
              <li key={recommendation}>{recommendation}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-md bg-white p-2">
          <div className="font-medium text-gray-900">Status draft</div>
          <p className="mt-1 text-gray-700">{demoTaskCoachInsight.statusDraft}</p>
        </div>
      </div>
    </div>
  );
}

function DemoEmployeeDashboard({ onToggleDemo }: { onToggleDemo: () => void }) {
  const demoEmployee = demoEmployees[0];
  const [tasks, setTasks] = useState(
    demoTasks.filter((task) => task.assignedTo === demoEmployee._id)
  );
  const [selectedStatus, setSelectedStatus] = useState<
    "all" | "pending" | "in_progress" | "completed"
  >("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTasks = tasks.filter((task) => {
    if (selectedStatus !== "all" && task.status !== selectedStatus) {
      return false;
    }
    if (
      searchQuery &&
      !task.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !task.description.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const handleStatusChange = (
    taskId: Id<"tasks">,
    status: "pending" | "in_progress" | "completed"
  ) => {
    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task._id === taskId
          ? {
              ...task,
              status,
              updatedAt: Date.now(),
              completedAt: status === "completed" ? Date.now() : undefined,
            }
          : task
      )
    );
  };

  const stats = {
    pending: tasks.filter((task) => task.status === "pending").length,
    in_progress: tasks.filter((task) => task.status === "in_progress").length,
    completed: tasks.filter((task) => task.status === "completed").length,
    total: tasks.length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <DemoBadge />
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">My Tasks</h1>
              <span className="ml-3 rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-orange-700">
                Demo Mode
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-700">
                Welcome, {demoEmployee.name}
              </span>
              <button
                onClick={onToggleDemo}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Exit Demo
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Dashboard stats={stats.total === 0 ? demoStats : stats} />

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">My Tasks</h2>
          <p className="text-sm text-orange-700">
            Demo data is local only. No database calls are made.
          </p>
        </div>

        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <StatusFilter
            selectedStatus={selectedStatus}
            onStatusChange={setSelectedStatus}
          />
          <div>
            <label htmlFor="demo-employee-search" className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <input
              id="demo-employee-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search demo tasks..."
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTasks.length > 0 ? (
            filteredTasks.map((task) => (
              <div key={task._id}>
                <TaskCard
                  task={task}
                  onStatusChange={handleStatusChange}
                  canEdit={false}
                />
                <DemoTaskCoachCard />
              </div>
            ))
          ) : (
            <div className="col-span-full text-center text-gray-500 py-8">
              No demo tasks assigned to you yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
