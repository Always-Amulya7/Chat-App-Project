import React from "react";
import { cn } from "../lib/utils";

class AuthErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to console or error reporting service
    console.error("Auth Error Boundary caught an error:", error, errorInfo);

    this.setState({
      error: error,
      errorInfo: errorInfo,
    });

    // You can also log the error to an error reporting service here
    // Example: logErrorToService(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col justify-center items-center h-screen p-8 text-center bg-background text-foreground">
          <h2 className="text-xl font-semibold mb-6 text-destructive">
            Authentication Error
          </h2>
          <p className="mb-6 text-lg">
            Something went wrong with the authentication system.
          </p>
          <details className="mt-4 text-left w-full max-w-2xl">
            <summary className="cursor-pointer mb-4 font-bold text-lg text-destructive">
              Error Details (Click to expand)
            </summary>
            <pre className="text-xs overflow-auto p-4 rounded max-h-48 text-left bg-muted text-muted-foreground">
              {this.state.error && this.state.error.toString()}
              <br />
              {this.state.errorInfo.componentStack}
            </pre>
          </details>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null, errorInfo: null });
              window.location.reload();
            }}
            className="mt-6 px-6 py-3 rounded font-bold transition-colors hover:opacity-90 bg-primary text-primary-foreground"
          >
            Reload Application
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default AuthErrorBoundary;
