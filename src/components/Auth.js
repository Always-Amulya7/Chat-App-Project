import React from "react";
import { auth } from "../firebase-config";
import { GoogleAuthProvider, signInWithPopup, signInAnonymously } from "firebase/auth";
import "../styles/Auth.css";
import Cookies from "universal-cookie";

const cookies = new Cookies();

export const Auth = ({ setIsAuth }) => {
  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      cookies.set("auth-token", result.user.refreshToken);
      setIsAuth(true);
    } catch (err) {
      alert("Google sign-in failed");
    }
  };

  const signInAnon = async () => {
    try {
      await signInAnonymously(auth);
      setIsAuth(true);
    } catch (err) {
      alert("Anonymous sign-in failed");
    }
  };

  return (
    <div className="auth">
      <button onClick={signInWithGoogle}>Sign in with Google</button>
      <button onClick={signInAnon}>Continue as Guest</button>
    </div>
  );
};
