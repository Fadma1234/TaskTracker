import { useQuery, useMutation } from "convex/react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import Dashboard from "../components/Dashboard";
import TaskCard from "../components/TaskCard";
import TaskForm from "../components/TaskForm";
import EmployeeFilter from "../components/EmployeeFilter";
import StatusFilter from "../components/StatusFilter";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Id<"users"> | "all">("all");
  const [selectedStatus, setSelectedStatus] = useState<
    "all" | "pending" | "in_progress" | "completed"
  >("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Get current user email from localStorage (demo auth)
  const userEmail = localStorage.getItem("userEmail") || "";

  const currentUser = useQuery(api.auth.getCurrentUser, { email: userEmail });
  const stats = useQuery(api.dashboard.getTaskStats, { userEmail });
  const tasks = useQuery(api.tasks.getTasks, { userEmail });
  const employees = useQuery(api.users.getAllEmployees);
  const employeeSummaries = useQuery(api.dashboard.getEmployeeTaskSummary, { userEmail });

  const createTask = useMutation(api.tasks.createTask);
  const updateTaskStatus = useMutation(api.tasks.updateTaskStatus);
  const deleteTask = useMutation(api.tasks.deleteTask);
  const deleteEmployee = useMutation(api.users.deleteEmployee);

  const handleLogout = () => {
    localStorage.removeItem("userEmail");
    navigate("/login");
  };

  const handleCreateTask = async (data: {
    title: string;
    description: string;
    assignedTo: Id<"users">;
    priority: "low" | "medium" | "high";
    dueDate?: number;
  }) => {
    try {
      await createTask({ ...data, userEmail });
      setShowTaskForm(false);
    } catch (error) {
      console.error("Failed to create task:", error);
      alert("Failed to create task");
    }
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

  const handleDeleteEmployee = async (employeeId: Id<"users">, employeeName: string) => {
    const confirmMessage = `Are you sure you want to delete ${employeeName}?\n\nThis will also delete all tasks assigned to this employee.`;
    if (!confirm(confirmMessage)) return;
    
    try {
      const result = await deleteEmployee({ employeeId, userEmail });
      alert(
        `Employee ${employeeName} deleted successfully.\n` +
        `${result.deletedTasksCount} task(s) were also deleted.`
      );
    } catch (error: any) {
      console.error("Failed to delete employee:", error);
      alert(error?.message || "Failed to delete employee");
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

  if (!userEmail || currentUser === undefined || stats === undefined || tasks === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!currentUser || currentUser.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-red-600">Access denied. Admin only.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
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

        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Tasks</h2>
          <button
            onClick={() => setShowTaskForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Create New Task
          </button>
        </div>

        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          {employees && (
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

        {employeeSummaries && employeeSummaries.length > 0 && (
          <div className="mb-8 bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Employee Performance</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {employeeSummaries.map((summary) => (
                <div key={summary.employee._id} className="border rounded-lg p-4 relative">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-gray-900">{summary.employee.name}</h4>
                    <button
                      onClick={() => handleDeleteEmployee(summary.employee._id, summary.employee.name)}
                      className="text-red-600 hover:text-red-800 p-1"
                      title="Delete employee"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                  <div className="mt-2 text-sm text-gray-600">
                    <div>Email: {summary.employee.email}</div>
                    <div className="mt-2 font-medium">Tasks:</div>
                    <div>Total: {summary.totalTasks}</div>
                    <div>Pending: {summary.pendingTasks}</div>
                    <div>In Progress: {summary.inProgressTasks}</div>
                    <div>Completed: {summary.completedTasks}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All Employees List Section */}
        {employees && employees.length > 0 && (
          <div className="mb-8 bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">All Employees</h3>
              <span className="text-sm text-gray-500">{employees.length} employee(s)</span>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tasks Assigned
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {employees.map((employee) => {
                    const employeeTasks = tasks?.filter((t) => t.assignedTo === employee._id) || [];
                    return (
                      <tr key={employee._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {employee.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {employee.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {employeeTasks.length} task(s)
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleDeleteEmployee(employee._id, employee.name)}
                            className="text-red-600 hover:text-red-900 px-3 py-1 rounded hover:bg-red-50"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTasks && filteredTasks.length > 0 ? (
            filteredTasks.map((task) => (
              <TaskCard
                key={task._id}
                task={task}
                assignedToName={employeeMap.get(task.assignedTo)}
                onStatusChange={handleStatusChange}
                onDelete={handleDeleteTask}
                canEdit={true}
              />
            ))
          ) : (
            <div className="col-span-full text-center text-gray-500 py-8">
              No tasks found
            </div>
          )}
        </div>

        {showTaskForm && employees && (
          <TaskForm
            employees={employees}
            onSubmit={handleCreateTask}
            onCancel={() => setShowTaskForm(false)}
          />
        )}
      </div>
    </div>
  );
}
