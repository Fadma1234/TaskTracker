import { useQuery, useMutation } from "convex/react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import Dashboard from "../components/Dashboard";
import TaskCard from "../components/TaskCard";
import StatusFilter from "../components/StatusFilter";

export default function EmployeeDashboard() {
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
              <TaskCard
                key={task._id}
                task={task}
                onStatusChange={handleStatusChange}
                canEdit={false}
              />
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
