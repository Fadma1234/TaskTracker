interface DashboardProps {
  stats: {
    pending: number;
    in_progress: number;
    completed: number;
    total: number;
  };
}

export default function Dashboard({ stats }: DashboardProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-sm font-medium text-gray-500">Total Tasks</div>
        <div className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</div>
      </div>
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-sm font-medium text-yellow-600">Pending</div>
        <div className="text-3xl font-bold text-yellow-800 mt-2">{stats.pending}</div>
      </div>
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-sm font-medium text-blue-600">In Progress</div>
        <div className="text-3xl font-bold text-blue-800 mt-2">{stats.in_progress}</div>
      </div>
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-sm font-medium text-green-600">Completed</div>
        <div className="text-3xl font-bold text-green-800 mt-2">{stats.completed}</div>
      </div>
    </div>
  );
}
