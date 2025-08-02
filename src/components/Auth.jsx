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
import { cn } from "../lib/utils";

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
    <div className="relative flex size-full min-h-screen flex-col p-4 bg-background">
      <div className="layout-container flex h-full grow flex-col">
        <div className="px-4 md:px-40 flex flex-1 justify-center py-5">
          <div className="layout-content-container flex flex-col w-xl max-w-xl py-5 px-4 flex-1">
            <h1 className="tracking-light text-3xl font-bold leading-tight px-4 text-center pb-3 pt-6 text-foreground">
              Connect and Collaborate
            </h1>
            <p className="text-base font-normal leading-normal pb-3 pt-1 px-4 text-center text-muted-foreground">
              Join our community and start chatting with friends and colleagues.
            </p>

            {displayError && (
              <div className="flex justify-center">
                <div className="flex flex-1 max-w-lg flex-col items-stretch px-4">
                  <div className="mb-4 rounded-xl border p-4 shadow-sm bg-red-100 dark:bg-red-900 border-red-300 dark:border-red-700 w-full">
                    <p className="text-sm font-medium leading-relaxed text-red-800 dark:text-red-100">
                      {displayError}
                    </p>
                    <button
                      onClick={clearErrors}
                      className="mt-3 inline-block rounded-md bg-red-600 px-3 py-1 text-sm font-semibold text-white hover:bg-red-700 transition"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-center">
              <div className="flex flex-1 gap-4 max-w-lg flex-col items-stretch px-4 py-4">
                <ButtonLoader
                  onClick={signInWithGoogle}
                  loading={googleLoading}
                  disabled={anonLoading}
                  className="flex min-w-24 max-w-lg cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 text-sm font-bold leading-normal tracking-wide w-full disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-all bg-primary"
                >
                  Sign in with Google
                </ButtonLoader>

                <ButtonLoader
                  onClick={signInAnon}
                  loading={anonLoading}
                  disabled={googleLoading}
                  className="flex min-w-24 max-w-lg cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 text-sm font-bold leading-normal tracking-wide w-full disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-all bg-secondary text-secondary-foreground"
                >
                  Continue as Guest
                </ButtonLoader>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
