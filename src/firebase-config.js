// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "@firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCo7v7EzYImJATU42CuFUGGfxgaDxp6eRQ",
  authDomain: "chattersphere-78a82.firebaseapp.com",
  projectId: "chattersphere-78a82",
  storageBucket: "chattersphere-78a82.firebasestorage.app",
  messagingSenderId: "73984970302",
  appId: "1:73984970302:web:21cb46bb226647439a4b6f"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
