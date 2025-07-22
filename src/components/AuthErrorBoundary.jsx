import React from "react";

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
        <div className="auth-error-boundary">
          <h2 className="auth-error-title">Authentication Error</h2>
          <p>Something went wrong with the authentication system.</p>
          <details className="auth-error-details">
            <summary className="auth-error-summary">
              Error Details (Click to expand)
            </summary>
            <pre className="auth-error-stack">
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
            className="auth-error-retry-button"
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
