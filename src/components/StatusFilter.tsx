interface StatusFilterProps {
  selectedStatus: "all" | "pending" | "in_progress" | "completed";
  onStatusChange: (status: "all" | "pending" | "in_progress" | "completed") => void;
}

export default function StatusFilter({
  selectedStatus,
  onStatusChange,
}: StatusFilterProps) {
  return (
    <div>
      <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-2">
        Filter by Status
      </label>
      <select
        id="status-filter"
        value={selectedStatus}
        onChange={(e) =>
          onStatusChange(e.target.value as "all" | "pending" | "in_progress" | "completed")
        }
        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
      >
        <option value="all">All Statuses</option>
        <option value="pending">Pending</option>
        <option value="in_progress">In Progress</option>
        <option value="completed">Completed</option>
      </select>
    </div>
  );
}
