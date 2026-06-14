import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render(): ReactNode {
    if (this.state.hasError) {
      let errorMessage = "An unexpected error occurred.";
      
      try {
        // Check if it's a Firestore error JSON
        const parsed = JSON.parse(this.state.error?.message || "");
        if (parsed.error && parsed.operationType) {
          errorMessage = `Permission denied for ${parsed.operationType} on ${parsed.path}. Please ensure you are logged in with the correct permissions.`;
        }
      } catch (e) {
        // Not a JSON error
        errorMessage = this.state.error?.message || errorMessage;
      }

      return (
        <div className="flex min-h-[400px] flex-col items-center justify-center p-8 text-center">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-600">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-bold uppercase tracking-tight">Something went wrong</h2>
          <p className="mt-4 max-w-md text-sm text-gray-500">{errorMessage}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-8 flex items-center space-x-2 bg-black px-6 py-3 text-xs font-bold uppercase tracking-widest text-white transition-all hover:bg-gray-800"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Reload Application</span>
          </button>
        </div>
      );
    }

    return (this as any).props.children;
  }
}
