import React from "react";
import ReactDOM from "react-dom/client";
import { ConvexProvider } from "convex/react";
import { convex } from "./lib/convex";
import App from "./App";
import "./index.css";

const convexUrl = import.meta.env.VITE_CONVEX_URL;

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {!convexUrl ? (
      <div style={{ 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center", 
        minHeight: "100vh",
        padding: "20px",
        textAlign: "center",
        fontFamily: "system-ui, sans-serif"
      }}>
        <div>
          <h1 style={{ fontSize: "24px", marginBottom: "16px", color: "#dc2626" }}>
            Convex Backend Not Configured
          </h1>
          <p style={{ marginBottom: "8px", color: "#374151" }}>
            Please set up your Convex backend by running:
          </p>
          <code style={{ 
            display: "block", 
            padding: "12px", 
            backgroundColor: "#f3f4f6", 
            borderRadius: "6px",
            marginBottom: "16px",
            color: "#1f2937"
          }}>
            npx convex dev
          </code>
          <p style={{ color: "#6b7280", fontSize: "14px" }}>
            This will create a .env.local file with your VITE_CONVEX_URL
          </p>
        </div>
      </div>
    ) : (
      <ConvexProvider client={convex}>
        <App />
      </ConvexProvider>
    )}
  </React.StrictMode>
);
