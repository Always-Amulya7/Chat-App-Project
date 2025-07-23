import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { auth } from "../firebase-config";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInAnonymously,
} from "firebase/auth";
import { useAuth } from "../contexts/AuthContext";
import { ButtonLoader } from "./LoadingComponents";

export const Auth = () => {
  const [googleLoading, setGoogleLoading] = useState(false);
  const [anonLoading, setAnonLoading] = useState(false);
  const [authError, setAuthError] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();
  const { clearError, error: authContextError } = useAuth();

  // Get return URL from location state
  const from = location.state?.from || "/rooms";

  useEffect(() => {
    // Clear any existing errors when component mounts
    clearError();
    setAuthError(null);
  }, [clearError]);

  const handleAuthError = (error, method) => {
    console.error(`${method} authentication error:`, error);

    let errorMessage = "Authentication failed. Please try again.";

    switch (error.code) {
      case "auth/popup-closed-by-user":
        errorMessage = "Sign-in was cancelled. Please try again.";
        break;
      case "auth/popup-blocked":
        errorMessage = "Popup was blocked. Please allow popups and try again.";
        break;
      case "auth/network-request-failed":
        errorMessage =
          "Network error. Please check your connection and try again.";
        break;
      case "auth/too-many-requests":
        errorMessage = "Too many attempts. Please wait a moment and try again.";
        break;
      case "auth/user-disabled":
        errorMessage =
          "This account has been disabled. Please contact support.";
        break;
      case "auth/operation-not-allowed":
        errorMessage =
          "This sign-in method is not enabled. Please contact support.";
        break;
      default:
        errorMessage = `Authentication failed: ${error.message}`;
    }

    setAuthError(errorMessage);
  };

  const signInWithGoogle = async () => {
    try {
      setGoogleLoading(true);
      setAuthError(null);
      clearError();

      const provider = new GoogleAuthProvider();
      // Add additional scopes if needed
      provider.addScope("profile");
      provider.addScope("email");

      // Configure popup
      provider.setCustomParameters({
        prompt: "select_account",
      });

      const result = await signInWithPopup(auth, provider);

      if (result.user) {
        // Navigate to intended destination
        navigate(from, { replace: true });
      }
    } catch (error) {
      handleAuthError(error, "Google");
    } finally {
      setGoogleLoading(false);
    }
  };

  const signInAnon = async () => {
    try {
      setAnonLoading(true);
      setAuthError(null);
      clearError();

      const result = await signInAnonymously(auth);

      if (result.user) {
        // Navigate to intended destination
        navigate(from, { replace: true });
      }
    } catch (error) {
      handleAuthError(error, "Anonymous");
    } finally {
      setAnonLoading(false);
    }
  };

  const clearErrors = () => {
    setAuthError(null);
    clearError();
  };

  // Display error from context or local state
  const displayError = authContextError || authError;

  return (
    <div className="auth">
      <div>
        <h2>Welcome to Chat App</h2>
        <p>Please sign in to continue</p>

        {displayError && (
          <div className="error-message">
            <p className="error-text">{displayError}</p>
            <button onClick={clearErrors} className="error-dismiss-button">
              Dismiss
            </button>
          </div>
        )}

        <div className="auth-buttons">
          <ButtonLoader
            onClick={signInWithGoogle}
            loading={googleLoading}
            disabled={anonLoading}
            className="auth-button google-signin"
          >
            Sign in with Google
          </ButtonLoader>

          <ButtonLoader
            onClick={signInAnon}
            loading={anonLoading}
            disabled={googleLoading}
            className="auth-button anonymous-signin"
          >
            Continue as Guest
          </ButtonLoader>
        </div>
      </div>
    </div>
  );
};
