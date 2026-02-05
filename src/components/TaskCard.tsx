import { Id } from "../../convex/_generated/dataModel";

interface TaskCardProps {
  task: {
    _id: Id<"tasks">;
    title: string;
    description: string;
    status: "pending" | "in_progress" | "completed";
    priority: "low" | "medium" | "high";
    dueDate?: number;
    assignedTo: Id<"users">;
  };
  assignedToName?: string;
  onStatusChange?: (taskId: Id<"tasks">, status: "pending" | "in_progress" | "completed") => void;
  onDelete?: (taskId: Id<"tasks">) => void;
  canEdit?: boolean;
}

export default function TaskCard({
  task,
  assignedToName,
  onStatusChange,
  onDelete,
  canEdit = false,
}: TaskCardProps) {
  const statusColors = {
    pending: "bg-yellow-100 text-yellow-800",
    in_progress: "bg-blue-100 text-blue-800",
    completed: "bg-green-100 text-green-800",
  };

  const priorityColors = {
    low: "bg-gray-100 text-gray-800",
    medium: "bg-orange-100 text-orange-800",
    high: "bg-red-100 text-red-800",
  };

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return null;
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{task.title}</h3>
          <p className="text-sm text-gray-600 mb-3">{task.description}</p>
        </div>
        {canEdit && onDelete && (
          <button
            onClick={() => onDelete(task._id)}
            className="ml-4 text-red-600 hover:text-red-800"
            title="Delete task"
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
        )}
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[task.status]}`}
        >
          {task.status.replace("_", " ").toUpperCase()}
        </span>
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${priorityColors[task.priority]}`}
        >
          {task.priority.toUpperCase()} PRIORITY
        </span>
        {task.dueDate && (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            Due: {formatDate(task.dueDate)}
          </span>
        )}
      </div>

      {assignedToName && (
        <p className="text-sm text-gray-500 mb-4">
          Assigned to: <span className="font-medium">{assignedToName}</span>
        </p>
      )}

      {onStatusChange && (
        <div className="flex gap-2">
          {task.status !== "pending" && (
            <button
              onClick={() => onStatusChange(task._id, "pending")}
              className="px-3 py-1 text-sm bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200"
            >
              Mark Pending
            </button>
          )}
          {task.status !== "in_progress" && (
            <button
              onClick={() => onStatusChange(task._id, "in_progress")}
              className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
            >
              Mark In Progress
            </button>
          )}
          {task.status !== "completed" && (
            <button
              onClick={() => onStatusChange(task._id, "completed")}
              className="px-3 py-1 text-sm bg-green-100 text-green-800 rounded hover:bg-green-200"
            >
              Mark Completed
            </button>
          )}
        </div>
      )}
    </div>
  );
}
