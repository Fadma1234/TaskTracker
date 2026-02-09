import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { useNavigate } from "react-router-dom";
import { api } from "../../convex/_generated/api";

export default function Login() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"admin" | "employee">("employee");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [convexStatus, setConvexStatus] = useState<"checking" | "connected" | "disconnected">("checking");
  const navigate = useNavigate();
  const getOrCreateUser = useMutation(api.auth.getOrCreateUser);
  
  // Test Convex connection
  const testConnection = useQuery(api.test.testConnection);
  
  // Check Convex connection status
  useEffect(() => {
    const convexUrl = import.meta.env.VITE_CONVEX_URL;
    console.log("Convex URL from env:", convexUrl);
    
    if (!convexUrl || convexUrl === "https://placeholder.convex.cloud") {
      setConvexStatus("disconnected");
      console.warn("Convex URL not configured");
    } else {
      // Connection status will be updated based on testConnection query result
      if (testConnection === undefined) {
        setConvexStatus("checking");
      } else if (testConnection) {
        setConvexStatus("connected");
        console.log("Convex connection test successful:", testConnection);
      } else {
        setConvexStatus("disconnected");
      }
    }
  }, [testConnection]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Validate inputs
    if (!email || !name) {
      setError("Please fill in all required fields");
      setIsLoading(false);
      return;
    }

    try {
      // Check if Convex URL is configured
      const convexUrl = import.meta.env.VITE_CONVEX_URL;
      if (!convexUrl || convexUrl === "https://placeholder.convex.cloud") {
        setError(
          "Convex backend not configured. Please:\n" +
          "1. Run 'npx convex dev' in your terminal\n" +
          "2. Wait for it to generate a .env.local file\n" +
          "3. Refresh this page"
        );
        setIsLoading(false);
        return;
      }

      // For demo purposes, we'll use a simple localStorage-based auth
      // In production, you'd integrate with Clerk, Auth0, or Convex Auth
      console.log("Creating account with:", { email, name, role });
      const userId = await getOrCreateUser({ email, name, role });
      console.log("Account created/found:", userId);
      
      // Store user email in localStorage for demo auth
      localStorage.setItem("userEmail", email);
      
      // Small delay to ensure localStorage is set
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Navigate based on role
      if (role === "admin") {
        navigate("/admin");
      } else {
        navigate("/employee");
      }
    } catch (error: any) {
      console.error("Login error details:", error);
      console.error("Error stack:", error?.stack);
      
      let errorMessage = "Failed to create account. ";
      
      // Check for specific error types
      if (error?.message) {
        errorMessage += error.message;
      } else if (error?.toString) {
        errorMessage += error.toString();
      } else {
        errorMessage += "Unknown error occurred.";
      }
      
      // Check for common errors
      if (errorMessage.includes("VITE_CONVEX_URL") || errorMessage.includes("Missing")) {
        setError(
          "Convex backend not configured.\n\n" +
          "Please run 'npx convex dev' in your terminal to set up the backend."
        );
      } else if (
        errorMessage.includes("network") || 
        errorMessage.includes("fetch") || 
        errorMessage.includes("Failed to fetch") ||
        errorMessage.includes("ECONNREFUSED")
      ) {
        setError(
          "Cannot connect to Convex backend.\n\n" +
          "Make sure:\n" +
          "1. You've run 'npx convex dev' in a terminal\n" +
          "2. The Convex dev server is still running\n" +
          "3. Check the terminal for any error messages"
        );
      } else if (errorMessage.includes("schema") || errorMessage.includes("index")) {
        setError(
          "Database schema error.\n\n" +
          "The database might not be initialized. Try running 'npx convex dev' again."
        );
      } else {
        setError(errorMessage + "\n\nCheck the browser console (F12) for more details.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
        <div>
          <h2 className="text-3xl font-bold text-center text-gray-900">
            Task Tracker
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to your account
          </p>
          {convexStatus === "checking" && (
            <div className="mt-4 bg-blue-50 border border-blue-200 text-blue-800 px-4 py-2 rounded text-sm">
              🔄 Checking backend connection...
            </div>
          )}
          {convexStatus === "disconnected" && (
            <div className="mt-4 bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-2 rounded text-sm">
              <div className="font-semibold mb-1">⚠️ Backend not connected</div>
              <div className="text-xs space-y-1">
                <div>1. Open a terminal in your project folder</div>
                <div>2. Run: <code className="bg-yellow-100 px-1 rounded">npx convex dev</code></div>
                <div>3. Wait for it to say "Convex dev server running"</div>
                <div>4. Refresh this page</div>
              </div>
            </div>
          )}
          {convexStatus === "connected" && (
            <div className="mt-4 bg-green-50 border border-green-200 text-green-800 px-4 py-2 rounded text-sm">
              ✓ Backend connected and ready
            </div>
          )}
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                Role
              </label>
              <select
                id="role"
                name="role"
                value={role}
                onChange={(e) => setRole(e.target.value as "admin" | "employee")}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="employee">Employee</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              <p className="text-sm whitespace-pre-line">{error}</p>
              <p className="text-xs mt-2 text-red-600">
                Tip: Open browser console (F12) to see detailed error messages
              </p>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isLoading ? "Signing in..." : "Sign in"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
