import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { cn } from "../lib/utils";
import EmojiPicker from "emoji-picker-react";
import { IoMdHappy } from "react-icons/io";
import ReactMarkdown from "react-markdown";
import trainingData from "../lib/trainingData.json";
import { GoogleGenerativeAI } from "@google/generative-ai";

import { FixedSizeList as List } from "react-window";
import { MessagesSkeleton } from "./LoadingComponents";

// Firebase imports
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  addDoc,
  serverTimestamp,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { db, rtdb } from "../firebase-config";
import { ref, onValue, onDisconnect, set, serverTimestamp as rtdbServerTimestamp } from "firebase/database";
import { RiDeleteBin6Line } from "react-icons/ri";

// 🔑 Initialize Gemini SDK
const genAI = new GoogleGenerativeAI(
  import.meta.env.VITE_API_GENERATIVE_LANGUAGE_CLIENT
);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// --- Utility functions (same as before) ---
// findBestMatch, calculateSimilarity, getRandomSampleQuestion, etc.

// --- sendBotReply, getAIResponse, getGeminiResponse (same as before) ---

const Chat = ({ dark }) => {
  const { roomId } = useParams();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isBotReplying, setIsBotReplying] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [apiStatus, setApiStatus] = useState("connecting");

  const containerRef = useRef(null);
  const bottomRef = useRef(null);
  const [onlineUsers, setOnlineUsers] = useState([]);

  // 🔥 Firestore subscription
  useEffect(() => {
    if (!roomId) return;
    const q = query(
      collection(db, `rooms/${roomId}/messages`),
      orderBy("timestamp", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newMessages = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        isCurrentUser: doc.data().userId === user?.uid,
      }));
      setMessages(newMessages);
      setLoadingMessages(false);
    });

    return () => unsubscribe();
  }, [roomId, user?.uid]);

  // Presence tracking
  useEffect(() => {
    if (!roomId || !user) return;

    const presenceRef = ref(rtdb, `rooms/${roomId}/presence/${user.uid}`);
    const connectedRef = ref(rtdb, ".info/connected");

    const unsubscribeConnected = onValue(connectedRef, (snap) => {
      if (snap.val() === true) {
        set(presenceRef, {
          online: true,
          displayName: user.displayName || "Anonymous",
          lastSeen: rtdbServerTimestamp()
        });
        onDisconnect(presenceRef).set({
          online: false,
          displayName: user.displayName || "Anonymous",
          lastSeen: rtdbServerTimestamp()
        });
      }
    });

    const roomPresenceRef = ref(rtdb, `rooms/${roomId}/presence`);
    const unsubscribePresence = onValue(roomPresenceRef, (snapshot) => {
      const users = [];
      snapshot.forEach((childSnap) => {
        const data = childSnap.val();
        if (data && data.online) {
          users.push({
            uid: childSnap.key,
            displayName: data.displayName
          });
        }
      });
      setOnlineUsers(users);
    });

    return () => {
      unsubscribeConnected();
      unsubscribePresence();
      set(presenceRef, {
        online: false,
        displayName: user.displayName || "Anonymous",
        lastSeen: rtdbServerTimestamp()
      });
    };
  }, [roomId, user]);

  // 🟢 Handle send
  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = {
      text: input,
      user: user?.displayName || "Anonymous",
      userId: user?.uid,
      timestamp: serverTimestamp(),
    };

    try {
      await addDoc(collection(db, `rooms/${roomId}/messages`), userMessage);
    } catch (e) {
      console.error("Error adding document: ", e);
    }

    const currentMessage = input;
    setInput("");
    await sendBotReply(currentMessage, roomId, messages, setMessages, setIsBotReplying);
  };

  // 🆕 Delete message
  const handleDeleteMessage = async (messageId) => {
    try {
      const messageDocRef = doc(db, `rooms/${roomId}/messages`, messageId);
      await deleteDoc(messageDocRef);
      console.log("Message deleted successfully!");
    } catch (error) {
      console.error("Error deleting message: ", error);
      alert("Failed to delete the message. Please try again.");
    }
  };

  // Render online users list UI
  const renderOnlineUsers = () => {
    if (onlineUsers.length === 0) {
      return <p className="text-sm text-gray-500 dark:text-gray-400">No users online</p>;
    }
    return (
      <ul className="flex space-x-4 overflow-x-auto py-2">
        {onlineUsers.map((user) => (
          <li key={user.uid} className="flex items-center space-x-2">
            <span className="inline-block w-3 h-3 rounded-full bg-green-500" title="Online"></span>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{user.displayName}</span>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 p-4 shadow">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Chat Room: {roomId}</h1>
        <div className="mt-2">
          {renderOnlineUsers()}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {loadingMessages ? (
          <MessagesSkeleton />
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`mb-2 p-2 rounded ${msg.isCurrentUser ? 'bg-blue-200 ml-auto' : 'bg-gray-200'}`}>
              <strong>{msg.user}:</strong> {msg.text}
            </div>
          ))
        )}
      </div>
      <div className="bg-white dark:bg-gray-800 p-4 flex">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          className="flex-1 p-2 border rounded mr-2"
          placeholder="Type a message..."
        />
        <button onClick={handleSend} className="bg-blue-500 text-white p-2 rounded">Send</button>
      </div>
    </div>
  );
};

export default Chat;

