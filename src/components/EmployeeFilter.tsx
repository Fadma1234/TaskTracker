import { Id } from "../../convex/_generated/dataModel";

interface EmployeeFilterProps {
  employees: Array<{ _id: Id<"users">; name: string; email: string }>;
  selectedEmployee: Id<"users"> | "all";
  onEmployeeChange: (employeeId: Id<"users"> | "all") => void;
}

export default function EmployeeFilter({
  employees,
  selectedEmployee,
  onEmployeeChange,
}: EmployeeFilterProps) {
  return (
    <div>
      <label htmlFor="employee-filter" className="block text-sm font-medium text-gray-700 mb-2">
        Filter by Employee
      </label>
      <select
        id="employee-filter"
        value={selectedEmployee}
        onChange={(e) =>
          onEmployeeChange(e.target.value === "all" ? "all" : (e.target.value as Id<"users">))
        }
        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
      >
        <option value="all">All Employees</option>
        {employees.map((emp) => (
          <option key={emp._id} value={emp._id}>
            {emp.name}
          </option>
        ))}
      </select>
    </div>
  );
}
