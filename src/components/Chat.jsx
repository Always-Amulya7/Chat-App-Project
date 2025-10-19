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
  updateDoc,
  arrayUnion,
  getDoc,
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

// NEW: Format last seen time
function formatLastSeen(timestamp) {
  if (!timestamp) return "Never";
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
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
  const [offlineUsers, setOfflineUsers] = useState([]); // NEW
  const [showUserList, setShowUserList] = useState(false); // NEW
  const [showHistory, setShowHistory] = useState({
    show: false,
    messageId: null,
    history: [],
  });

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  // Auto-scroll
  const scrollToBottom = () => {
    const container = messagesContainerRef.current;
    if (container) {
      const isNearBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight <
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

  // ENHANCED: Presence tracking with offline users
  useEffect(() => {
    if (!roomId || !user) return;

    const presenceRef = ref(rtdb, `rooms/${roomId}/presence/${user.uid}`);
    const connectedRef = ref(rtdb, ".info/connected");

    const unsubscribeConnected = onValue(connectedRef, (snap) => {
      if (snap.val() === true) {
        set(presenceRef, {
          online: true,
          displayName: user.displayName || "Anonymous",
          photoURL: user.photoURL || null,
          lastSeen: rtdbServerTimestamp(),
        });
        onDisconnect(presenceRef).set({
          online: false,
          displayName: user.displayName || "Anonymous",
          photoURL: user.photoURL || null,
          lastSeen: rtdbServerTimestamp(),
        });
      }
    });

    const roomPresenceRef = ref(rtdb, `rooms/${roomId}/presence`);
    const unsubscribePresence = onValue(roomPresenceRef, (snapshot) => {
      const online = [];
      const offline = [];

      snapshot.forEach((childSnap) => {
        const data = childSnap.val();
        if (data) {
          const userData = {
            uid: childSnap.key,
            displayName: data.displayName,
            photoURL: data.photoURL,
            lastSeen: data.lastSeen,
          };

          if (data.online) {
            online.push(userData);
          } else {
            offline.push(userData);
          }
        }
      });

      setOnlineUsers(online);
      setOfflineUsers(offline);
    });

    return () => {
      unsubscribeConnected();
      unsubscribePresence();
      set(presenceRef, {
        online: false,
        displayName: user.displayName || "Anonymous",
        photoURL: user.photoURL || null,
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
      edited: false,
      editHistory: [],
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

  const handleEdit = async (messageId, currentText) => {
    try {
      const messageDoc = await getDoc(
        doc(db, `rooms/${roomId}/messages`, messageId)
      );
      const timestamp = messageDoc.data()?.timestamp;
      if (!isEditable(timestamp)) {
        alert("Cannot edit: Messages can only be edited within 5 minutes.");
        return;
      }
    } catch (error) {
      console.error("Failed to check edit time:", error);
      alert("Cannot verify edit eligibility. Please try again.");
      return;
    }

    const newText = prompt("Edit your message:", currentText);
    if (newText && newText !== currentText) {
      try {
        const messageRef = doc(db, `rooms/${roomId}/messages`, messageId);
        await updateDoc(messageRef, {
          text: newText,
          edited: true,
          editHistory: arrayUnion({
            text: currentText,
            editedAt: new Date().toISOString(),
          }),
        });
      } catch (error) {
        console.error("Edit failed:", error);
        alert("Failed to edit message. Please try again.");
      }
    }
  };

  const isEditable = (timestamp) => {
    if (!timestamp) return false;
    const messageTime = timestamp.toDate();
    const now = new Date();
    const fiveMinutes = 5 * 60 * 1000;
    return now - messageTime < fiveMinutes;
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
        Gaming:
          "Welcome to Gaming! Ready to talk about your favorite games? 🎮",
      };

      const welcomeMessage =
        welcomeMessages[roomId] ||
        `Welcome to ${roomId}! Start chatting below.`;

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

  // NEW: Render enhanced online users with modal
  const renderOnlineUsers = () => {
    return (
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Online count */}
          <button
            onClick={() => setShowUserList(true)}
            className="flex items-center space-x-2 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 rounded-full hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
          >
            <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            <span className="text-sm font-medium text-green-700 dark:text-green-300">
              {onlineUsers.length} Online
            </span>
          </button>

          {/* Quick preview of online users */}
          <div className="flex -space-x-2">
            {onlineUsers.slice(0, 5).map((user) => (
              <div
                key={user.uid}
                className="relative w-8 h-8 rounded-full border-2 border-white dark:border-gray-800 overflow-hidden"
                title={user.displayName}
              >
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                    {user.displayName?.[0]?.toUpperCase() || "?"}
                  </div>
                )}
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></span>
              </div>
            ))}
            {onlineUsers.length > 5 && (
              <div className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-800 bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-medium text-gray-600 dark:text-gray-400">
                +{onlineUsers.length - 5}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 p-4 shadow-md border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span className="text-2xl">💬</span>
            {roomId}
          </h1>
          {renderOnlineUsers()}
        </div>
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
                "p-3 rounded-lg max-w-lg relative shadow-sm",
                msg.isAI
                  ? "bg-blue-100 dark:bg-blue-900/30 self-start"
                  : msg.isCurrentUser
                  ? "bg-green-100 dark:bg-green-900/30 self-end ml-auto"
                  : "bg-white dark:bg-gray-800 self-start"
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-sm text-gray-700 dark:text-gray-300">
                  {msg.user}
                </span>
                {msg.deviceType && (
                  <span className="text-xs text-gray-500">
                    {msg.deviceType === "mobile" && "📱"}
                    {msg.deviceType === "desktop" && "💻"}
                    {msg.deviceType === "bot" && "🤖"}
                  </span>
                )}
              </div>

              <ReactMarkdown className="text-gray-800 dark:text-gray-200">
                {msg.text}
              </ReactMarkdown>

              {msg.edited && (
                <span className="text-xs text-gray-500 italic ml-2">
                  (Edited)
                </span>
              )}

              <div className="flex space-x-2 mt-2">
                {msg.isCurrentUser && !msg.isAI && (
                  <>
                    <button
                      onClick={() => handleDeleteMessage(msg.id)}
                      className="text-red-500 text-xs hover:text-red-700"
                    >
                      <MdDelete className="inline mr-1" />
                      Delete
                    </button>
                    {isEditable(msg.timestamp) && (
                      <button
                        onClick={() => handleEdit(msg.id, msg.text)}
                        className="text-blue-500 text-xs hover:text-blue-700"
                      >
                        Edit
                      </button>
                    )}
                  </>
                )}
                {msg.editHistory && msg.editHistory.length > 0 && (
                  <button
                    onClick={() =>
                      setShowHistory({
                        show: true,
                        messageId: msg.id,
                        history: msg.editHistory,
                      })
                    }
                    className="text-purple-500 text-xs hover:text-purple-700"
                  >
                    History
                  </button>
                )}
              </div>
            </div>
          ))
        )}
        {isBotReplying && (
          <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 self-start italic text-gray-600 dark:text-gray-400">
            AI Assistant is typing...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-white dark:bg-gray-800 flex items-center space-x-2 border-t border-gray-200 dark:border-gray-700 relative">
        <button
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className="p-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
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
          className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          disabled={isBotReplying}
        />
        <button
          onClick={handleSend}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:bg-gray-400"
          disabled={isBotReplying}
        >
          {isBotReplying ? "AI Thinking..." : "Send"}
        </button>
      </div>

      {/* NEW: User List Modal */}
      {showUserList && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowUserList(false);
          }}
        >
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Room Users
              </h3>
              <button
                onClick={() => setShowUserList(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>

            {/* Online Users */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-green-600 dark:text-green-400 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                Online ({onlineUsers.length})
              </h4>
              <div className="space-y-2">
                {onlineUsers.map((user) => (
                  <div
                    key={user.uid}
                    className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg"
                  >
                    <div className="relative">
                      {user.photoURL ? (
                        <img
                          src={user.photoURL}
                          alt={user.displayName}
                          className="w-10 h-10 rounded-full"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                          {user.displayName?.[0]?.toUpperCase() || "?"}
                        </div>
                      )}
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {user.displayName}
                      </p>
                      <p className="text-xs text-green-600 dark:text-green-400">
                        Active now
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Offline Users */}
            {offlineUsers.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                  Offline ({offlineUsers.length})
                </h4>
                <div className="space-y-2">
                  {offlineUsers.map((user) => (
                    <div
                      key={user.uid}
                      className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg"
                    >
                      <div className="relative">
                        {user.photoURL ? (
                          <img
                            src={user.photoURL}
                            alt={user.displayName}
                            className="w-10 h-10 rounded-full grayscale"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-400 flex items-center justify-center text-white font-bold">
                            {user.displayName?.[0]?.toUpperCase() || "?"}
                          </div>
                        )}
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-gray-400 border-2 border-white dark:border-gray-800 rounded-full"></span>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-700 dark:text-gray-300">
                          {user.displayName}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Last seen {formatLastSeen(user.lastSeen)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit History Modal */}
      {showHistory.show && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowHistory({ show: false, messageId: null, history: [] });
            }
          }}
        >
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">
              Edit History
            </h3>
            <ul className="space-y-2 mb-4">
              {showHistory.history.map((entry, index) => (
                <li
                  key={index}
                  className="text-sm text-gray-700 dark:text-gray-300"
                >
                  <strong>Version {index + 1}:</strong> "{entry.text}"
                  <br />
                  <span className="text-xs text-gray-500 italic">
                    Edited at {new Date(entry.editedAt).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
            <button
              onClick={() =>
                setShowHistory({ show: false, messageId: null, history: [] })
              }
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded w-full"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Chat;