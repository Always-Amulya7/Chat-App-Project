import React, { createContext, useContext, useState, useEffect } from "react";
import { auth } from "../firebase-config";
import { onAuthStateChanged, signOut } from "firebase/auth";
import Cookies from "universal-cookie";

const cookies = new Cookies();

// Create Auth Context
const AuthContext = createContext({});

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        setLoading(true);
        setError(null);

        if (user) {
          // Validate token freshness
          const tokenResult = await user.getIdTokenResult();
          const expirationTime = new Date(tokenResult.expirationTime);
          const now = new Date();

          // Check if token is expired or will expire in next 5 minutes
          if (expirationTime.getTime() - now.getTime() < 5 * 60 * 1000) {
            // Token is expired or will expire soon, refresh it
            try {
              await user.getIdToken(true); // Force refresh
            } catch (refreshError) {
              console.error("Token refresh failed:", refreshError);
              await handleSignOut();
              return;
            }
          }

          // Store user data
          setUser({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || "Anonymous User",
            photoURL: user.photoURL,
            isAnonymous: user.isAnonymous,
            emailVerified: user.emailVerified,
          });

          // Store auth token in cookies with expiration
          const token = await user.getIdToken();
          cookies.set("auth-token", token, {
            expires: expirationTime,
            secure: true,
            sameSite: "strict",
          });
        } else {
          setUser(null);
          cookies.remove("auth-token");
        }
      } catch (error) {
        console.error("Auth state change error:", error);
        setError("Authentication error occurred");
        setUser(null);
        cookies.remove("auth-token");
      } finally {
        setLoading(false);
      }
    });

    // Cleanup subscription
    return () => unsubscribe();
  }, []);

  // Auto-logout on token expiration
  useEffect(() => {
    if (!user) return;

    const checkTokenExpiry = async () => {
      try {
        const tokenResult = await auth.currentUser?.getIdTokenResult();
        if (!tokenResult) return;

        const expirationTime = new Date(tokenResult.expirationTime);
        const now = new Date();
        const timeUntilExpiry = expirationTime.getTime() - now.getTime();

        // If token expires in less than 1 minute, refresh it
        if (timeUntilExpiry < 60 * 1000 && timeUntilExpiry > 0) {
          try {
            await auth.currentUser.getIdToken(true);
          } catch (refreshError) {
            console.error("Auto token refresh failed:", refreshError);
            await handleSignOut();
          }
        } else if (timeUntilExpiry <= 0) {
          // Token is expired, sign out
          await handleSignOut();
        }
      } catch (error) {
        console.error("Token expiry check failed:", error);
      }
    };

    // Check token every 30 seconds
    const interval = setInterval(checkTokenExpiry, 30 * 1000);
    return () => clearInterval(interval);
  }, [user]);

  const handleSignOut = async () => {
    try {
      setLoading(true);
      await signOut(auth);
      setUser(null);
      cookies.remove("auth-token");
      setError(null);
    } catch (error) {
      console.error("Sign out error:", error);
      setError("Failed to sign out");
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => setError(null);

  const value = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    signOut: handleSignOut,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
