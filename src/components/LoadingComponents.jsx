import React from "react";

export const LoadingSpinner = ({ message = "Loading..." }) => {
  return (
    <div className="flex flex-col justify-center items-center h-screen bg-white">
      <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
      <p className="mt-4 text-base font-medium text-gray-700">{message}</p>
    </div>
  );
};

export const AuthLoading = () => <LoadingSpinner message="Authenticating..." />;

export const ButtonLoader = ({
  children,
  loading,
  className = "",
  ...props
}) => {
  return (
    <button
      {...props}
      disabled={loading || props.disabled}
      className={className}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <div className="w-4 h-4 border-2 border-transparent border-t-current rounded-full animate-spin" />
          <span>Loading...</span>
        </span>
      ) : (
        <span className="truncate">{children}</span>
      )}
    </button>
  );
};

export const MessageSkeleton = () => {
  return (
    <div className="p-2 border-b animate-pulse">
      <div className="flex items-center space-x-2">
        <div className="w-20 h-4 bg-gray-300 rounded"></div>
        <div className="w-32 h-4 bg-gray-300 rounded"></div>
      </div>
      <div className="mt-2 w-3/4 h-4 bg-gray-300 rounded"></div>
    </div>
  );
};

export const MessagesSkeleton = ({ count = 5 }) => {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }, (_, i) => (
        <MessageSkeleton key={i} />
      ))}
    </div>
  );
};
