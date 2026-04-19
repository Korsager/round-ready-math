import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Suppress noisy dev-only Recharts warning: "Function components cannot be given refs"
// originating from internal Recharts components (CartesianGrid, ReferenceArea, Label, etc.).
// Fixed upstream in Recharts 3.x; we're on 2.x. Safe to filter in dev.
if (import.meta.env.DEV) {
  const originalError = console.error;
  console.error = (...args: unknown[]) => {
    const first = args[0];
    if (typeof first === "string" && first.includes("Function components cannot be given refs")) {
      return;
    }
    originalError(...args);
  };
}

createRoot(document.getElementById("root")!).render(<App />);
