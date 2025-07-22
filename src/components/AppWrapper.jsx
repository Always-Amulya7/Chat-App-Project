import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { ButtonLoader } from "./LoadingComponents";

export const AppWrapper = ({ children }) => {
  const navigate = useNavigate();
  const { user, signOut, loading: authLoading, isAuthenticated } = useAuth();
  const [signOutLoading, setSignOutLoading] = React.useState(false);

  const handleSignOut = async () => {
    try {
      setSignOutLoading(true);
      await signOut();
      navigate("/auth");
    } catch (error) {
      console.error("Sign out failed:", error);
    } finally {
      setSignOutLoading(false);
    }
  };

  return (
    <div className="App">
      <div className="app-header">
        <h1>Chat App</h1>
        {isAuthenticated && user && (
          <div className="user-info">
            <span>Welcome, {user.displayName}!</span>
            {user.photoURL && (
              <img 
                src={user.photoURL} 
                alt="Profile" 
                className="user-avatar"
              />
            )}
          </div>
        )}
      </div>

      <div className="app-container">{children}</div>
      
      {isAuthenticated && (
        <div className="sign-out">
          <ButtonLoader
            onClick={handleSignOut}
            loading={signOutLoading || authLoading}
            className="sign-out-button"
          >
            Sign Out
          </ButtonLoader>
        </div>
      )}
    </div>
  );
};
