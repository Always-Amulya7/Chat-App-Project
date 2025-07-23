import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { AuthLoading } from "./LoadingComponents";

export const ProtectedRoute = ({ children }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (loading) {
    return <AuthLoading />;
  }

  // If not authenticated, redirect to auth page with return URL
  if (!isAuthenticated) {
    return (
      <Navigate 
        to="/auth" 
        state={{ from: location.pathname }} 
        replace 
      />
    );
  }

  // Additional security check: verify user object exists
  if (!user) {
    console.warn("Protected route accessed without valid user object");
    return <Navigate to="/auth" replace />;
  }

  // Render protected content
  return children;
};
