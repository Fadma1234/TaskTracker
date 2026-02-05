import { useQuery, useMutation } from "convex/react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import TaskCard from "../components/TaskCard";
import StatusFilter from "../components/StatusFilter";
import EmployeeFilter from "../components/EmployeeFilter";

export default function Tasks() {
  const navigate = useNavigate();
  const [selectedStatus, setSelectedStatus] = useState<
    "all" | "pending" | "in_progress" | "completed"
  >("all");
  const [selectedEmployee, setSelectedEmployee] = useState<Id<"users"> | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Get current user email from localStorage (demo auth)
  const userEmail = localStorage.getItem("userEmail") || "";

  const currentUser = useQuery(api.auth.getCurrentUser, { email: userEmail });
  const tasks = useQuery(api.tasks.getTasks, { userEmail });
  const employees = useQuery(api.users.getAllEmployees);

  const updateTaskStatus = useMutation(api.tasks.updateTaskStatus);
  const deleteTask = useMutation(api.tasks.deleteTask);

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

  const handleDeleteTask = async (taskId: Id<"tasks">) => {
    if (!confirm("Are you sure you want to delete this task?")) return;
    try {
      await deleteTask({ taskId, userEmail });
    } catch (error) {
      console.error("Failed to delete task:", error);
      alert("Failed to delete task");
    }
  };

  // Filter tasks
  const filteredTasks = tasks?.filter((task) => {
    if (selectedEmployee !== "all" && task.assignedTo !== selectedEmployee) {
      return false;
    }
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

  // Get employee name map
  const employeeMap = new Map(
    employees?.map((emp) => [emp._id, emp.name]) || []
  );

  if (!userEmail || currentUser === undefined || tasks === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-red-600">Please log in</div>
      </div>
    );
  }

  const isAdmin = currentUser.role === "admin";

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">Tasks</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-700">
                {currentUser.name} ({currentUser.role})
              </span>
              <button
                onClick={() => navigate(isAdmin ? "/admin" : "/employee")}
                className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Dashboard
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
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">All Tasks</h2>
        </div>

        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          {isAdmin && employees && (
            <EmployeeFilter
              employees={employees}
              selectedEmployee={selectedEmployee}
              onEmployeeChange={setSelectedEmployee}
            />
          )}
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
                assignedToName={employeeMap.get(task.assignedTo)}
                onStatusChange={handleStatusChange}
                onDelete={isAdmin ? handleDeleteTask : undefined}
                canEdit={isAdmin}
              />
            ))
          ) : (
            <div className="col-span-full text-center text-gray-500 py-8">
              No tasks found
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
