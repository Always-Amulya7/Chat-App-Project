import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Navigation } from "./Navigation";
import { useAuth } from "../contexts/AuthContext";
import { ButtonLoader } from "./LoadingComponents";
import {useState, useEffect} from "react";

export const AppWrapper = ({ children, dark, setDark }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut, loading: authLoading, isAuthenticated } = useAuth();
  const [signOutLoading, setSignOutLoading] = React.useState(false);
  const [showNavigation, setShowNavigation] = useState(true);

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

  // Get route-specific navigation props
  const getNavigationProps = () => {
    if (location.pathname === "/") {
      return {
        route: "landing",
        showNavigation: true,
      };
    }
    if (location.pathname === "/auth") {
      return {
        route: "auth",
        showNavigation: true,
      };
    }
    if (location.pathname.startsWith("/chat/")) {
      const roomId = location.pathname.split("/chat/")[1];
      return {
        route: "chat",
        roomId: roomId,
        customTitle: `Chat Room - ${roomId}`,
        showNavigation: isAuthenticated,
      };
    }
    if (location.pathname === "/rooms") {
      return {
        route: "rooms",
        showNavigation: isAuthenticated,
      };
    }
    return {
      route: "default",
      showNavigation: true,
    };
  };

  const navProps = getNavigationProps();

  return (
    <div className={dark ? "dark bg-gray-900 text-white min-h-screen" : "bg-white text-black min-h-screen"}>
      {navProps.showNavigation && (
        <Navigation {...navProps} dark={dark} setDark={setDark} />
      )}
      {children}
    </div>
  );
};
