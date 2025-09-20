import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { cn } from "../lib/utils";
import EmojiPicker from "emoji-picker-react";
import { IoMdHappy } from "react-icons/io";
import { MdDelete } from "react-icons/md";
import ReactMarkdown from "react-markdown";
import trainingData from "../lib/trainingData.json";
import { GoogleGenerativeAI } from "@google/generative-ai";

import { MessagesSkeleton } from "./LoadingComponents";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  addDoc,
  serverTimestamp,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db, rtdb } from "../firebase-config";
import {
  ref,
  onValue,
  onDisconnect,
  set,
  serverTimestamp as rtdbServerTimestamp,
} from "firebase/database";

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

// Utility: detect device type
function getDeviceType() {
  const ua = navigator.userAgent.toLowerCase();
  if (/mobile|android|iphone|ipad|ipod/.test(ua)) return "mobile";
  return "desktop";
}

async function getGeminiResponse(message, context) {
  try {
    const prompt = `
You are a helpful AI chat assistant. Maintain natural conversation flow.

User's message: ${message}

Conversation context:
${context.map((m) => `${m.user}: ${m.text}`).join("\n")}
    `;
    const result = await model.generateContent(prompt);
    return (
      result?.response?.candidates?.[0]?.content?.parts?.[0]?.text ??
      result?.response?.text() ??
      ""
    );
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "⚠️ AI service is currently unavailable.";
  }
}

export function Chat() {
  const { roomId } = useParams();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isBotReplying, setIsBotReplying] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [apiStatus, setApiStatus] = useState("connecting");
  const [onlineUsers, setOnlineUsers] = useState([]);

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  // Auto-scroll
  const scrollToBottom = () => {
    const container = messagesContainerRef.current;
    if (container) {
      const isNearBottom =
        container.scrollHeight -
          container.scrollTop -
          container.clientHeight <
        100;
      if (isNearBottom) {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }
    }
  };
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Firestore listener for messages
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
          lastSeen: rtdbServerTimestamp(),
        });
        onDisconnect(presenceRef).set({
          online: false,
          displayName: user.displayName || "Anonymous",
          lastSeen: rtdbServerTimestamp(),
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
            displayName: data.displayName,
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
        lastSeen: rtdbServerTimestamp(),
      });
    };
  }, [roomId, user]);

  // Send message
  const handleSend = async () => {
    if (!input.trim()) return;

    const newMessageObj = {
      userId: user?.uid,
      user: user?.displayName || "Anonymous",
      text: input,
      timestamp: serverTimestamp(),
      deviceType: getDeviceType(),
    };

    await addDoc(collection(db, `rooms/${roomId}/messages`), newMessageObj);
    const currentMessage = input;
    setInput("");

    await sendBotReply(currentMessage, roomId, messages);
    scrollToBottom();
  };

  // Delete message
  const handleDeleteMessage = async (messageId) => {
    try {
      const messageDocRef = doc(db, `rooms/${roomId}/messages`, messageId);
      await deleteDoc(messageDocRef);
    } catch (error) {
      console.error("Error deleting message: ", error);
      alert("Failed to delete the message. Please try again.");
    }
  };

  // Emoji picker
  const handleEmojiClick = (emojiObject) => {
    setInput((prev) => prev + emojiObject.emoji);
    setShowEmojiPicker(false);
  };

  // Send AI reply
  const sendBotReply = async (userMessage, roomId, prevMessages) => {
    setIsBotReplying(true);
    try {
      let replyText;
      if (apiStatus === "failed") {
        replyText =
          trainingData[userMessage.toLowerCase()] ??
          "Sorry, I can only reply with training data in offline mode.";
      } else {
        replyText = await getGeminiResponse(userMessage, prevMessages);
      }

      const aiMessage = {
        userId: "AI",
        user: "AI Assistant",
        text: replyText,
        timestamp: serverTimestamp(),
        isAI: true,
        deviceType: "bot",
      };
      await addDoc(collection(db, `rooms/${roomId}/messages`), aiMessage);
    } catch (error) {
      console.error("Error getting AI response:", error);
    } finally {
      setIsBotReplying(false);
    }
  };

  // Welcome message
  useEffect(() => {
    if (roomId) {
      const welcomeMessages = {
        General:
          "Welcome to the General chat room! Feel free to discuss anything here. 💬",
        "Tech Talk":
          "Welcome to Tech Talk! Let's dive into all things technology. 💻",
        Random: "Welcome to Random! Expect the unexpected here! 🎲",
        Gaming: "Welcome to Gaming! Ready to talk about your favorite games? 🎮",
      };

      const welcomeMessage =
        welcomeMessages[roomId] || `Welcome to ${roomId}! Start chatting below.`;

      const statusMessage =
        apiStatus === "failed"
          ? " (Running in offline mode with training data)"
          : apiStatus === "working"
          ? " (Connected to AI)"
          : "";

      setMessages([
        {
          id: "welcome-" + Date.now(),
          user: "AI Assistant",
          text: welcomeMessage + statusMessage,
          timestamp: new Date(),
          isAI: true,
          isWelcome: true,
          deviceType: "bot",
        },
      ]);
    }
  }, [roomId, apiStatus]);

  // Render online users list
  const renderOnlineUsers = () => {
    if (onlineUsers.length === 0) {
      return (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No users online
        </p>
      );
    }
    return (
      <ul className="flex space-x-4 overflow-x-auto py-2">
        {onlineUsers.map((user) => (
          <li key={user.uid} className="flex items-center space-x-2">
            <span
              className="inline-block w-3 h-3 rounded-full bg-green-500"
              title="Online"
            ></span>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {user.displayName}
            </span>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 p-4 shadow">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
          Chat Room: {roomId}
        </h1>
        <div className="mt-2">{renderOnlineUsers()}</div>
      </div>

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-2"
      >
        {loadingMessages ? (
          <MessagesSkeleton />
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "p-2 rounded-lg max-w-lg relative",
                msg.isAI
                  ? "bg-blue-100 self-start"
                  : msg.isCurrentUser
                  ? "bg-green-100 self-end"
                  : "bg-white self-start"
              )}
            >
              <div className="flex justify-between items-center">
                <strong>{msg.user}: </strong>
                {!msg.isAI && msg.isCurrentUser && (
                  <button
                    onClick={() => handleDeleteMessage(msg.id)}
                    className="text-red-500 text-xs"
                  >
                    Delete
                  </button>
                )}
              </div>
              <ReactMarkdown>{msg.text}</ReactMarkdown>

              {msg.isCurrentUser && !msg.isAI && !msg.isWelcome && (
                <button
                  onClick={() => handleDeleteMessage(msg.id)}
                  title="Delete message"
                  className="absolute top-1 right-1 text-red-600 hover:text-red-800"
                >
                  <MdDelete size={18} />
                </button>
              )}

              {msg.deviceType && (
                <div className="text-xs text-gray-500 mt-1">
                  {msg.deviceType === "mobile" && "📱 Mobile"}
                  {msg.deviceType === "desktop" && "💻 Desktop"}
                  {msg.deviceType === "bot" && "🤖 Bot"}
                </div>
              )}
            </div>
          ))
        )}
        {isBotReplying && (
          <div className="p-2 rounded-lg bg-blue-50 self-start italic">
            AI Assistant is typing...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-white flex items-center space-x-2 border-t relative">
        <button
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className="p-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          title="Add emoji"
          disabled={isBotReplying}
        >
          <IoMdHappy size={20} />
        </button>
        {showEmojiPicker && (
          <div className="absolute bottom-full left-4 mb-2 z-10">
            <EmojiPicker onEmojiClick={handleEmojiClick} />
          </div>
        )}
        <input
          className="flex-1 border rounded-lg p-2"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          disabled={isBotReplying}
        />
        <button
          onClick={handleSend}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg"
          disabled={isBotReplying}
        >
          {isBotReplying ? "AI Thinking..." : "Send"}
        </button>
      </div>
    </div>
  );
}

export default Chat;
