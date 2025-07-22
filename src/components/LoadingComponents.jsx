import React from "react";

export const LoadingSpinner = ({ message = "Loading..." }) => {
  return (
    <div className="loading-spinner">
      <div className="spinner" />
      <p className="loading-message">
        {message}
      </p>
    </div>
  );
};

export const AuthLoading = () => (
  <LoadingSpinner message="Authenticating..." />
);

export const ButtonLoader = ({ children, loading, className = "", ...props }) => {
  return (
    <button
      {...props}
      disabled={loading || props.disabled}
      className={`button-loader ${loading ? 'loading' : ''} ${className}`}
    >
      {loading ? (
        <span className="button-loading-content">
          <div className="button-spinner" />
          Loading...
        </span>
      ) : (
        children
      )}
    </button>
  );
};
