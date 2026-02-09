import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getAllEmployees = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("users")
      .withIndex("role", (q) => q.eq("role", "employee"))
      .collect();
  },
});

export const getEmployeesByTaskStatus = query({
  args: {
    status: v.union(
      v.literal("pending"),
      v.literal("in_progress"),
      v.literal("completed")
    ),
  },
  handler: async (ctx, args) => {
    const employees = await ctx.db
      .query("users")
      .withIndex("role", (q) => q.eq("role", "employee"))
      .collect();

    const employeesWithTasks = await Promise.all(
      employees.map(async (employee) => {
        const tasks = await ctx.db
          .query("tasks")
          .withIndex("assignedTo", (q) => q.eq("assignedTo", employee._id))
          .filter((q) => q.eq(q.field("status"), args.status))
          .collect();

        return { ...employee, tasks };
      })
    );

    return employeesWithTasks.filter((e) => e.tasks.length > 0);
  },
});

export const getUserProfile = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});

export const getCurrentUser = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    
    const email = identity.email;
    if (!email) return null;

    return await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", email))
      .first();
  },
});

export const deleteEmployee = mutation({
  args: {
    employeeId: v.id("users"),
    userEmail: v.string(),
  },
  handler: async (ctx, args) => {
    const { employeeId, userEmail } = args;
    
    // Verify admin permissions
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", userEmail))
      .first();

    if (!user || user.role !== "admin") {
      throw new Error("Only admins can delete employees");
    }

    // Verify the user being deleted is an employee
    const employee = await ctx.db.get(employeeId);
    if (!employee) {
      throw new Error("Employee not found");
    }

    if (employee.role !== "employee") {
      throw new Error("Can only delete employees");
    }

    // Check if employee has any tasks assigned
    const assignedTasks = await ctx.db
      .query("tasks")
      .withIndex("assignedTo", (q) => q.eq("assignedTo", employeeId))
      .collect();

    // Delete all tasks assigned to this employee
    for (const task of assignedTasks) {
      await ctx.db.delete(task._id);
    }

    // Delete the employee
    await ctx.db.delete(employeeId);
    
    return { success: true, deletedTasksCount: assignedTasks.length };
  },
});