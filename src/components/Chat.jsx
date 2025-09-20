import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { cn } from "../lib/utils";
import EmojiPicker from "emoji-picker-react";
import { IoMdHappy } from "react-icons/io";
import ReactMarkdown from "react-markdown";
import trainingData from "../lib/trainingData.json";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "../firebase-config";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

async function getGeminiResponse(message, context) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const prompt = `
You are a helpful AI chat assistant. Maintain natural conversation flow.

User's message: ${message}

Conversation context:
${context.map((m) => `${m.user}: ${m.text}`).join("\n")}
    `;

    const result = await model.generateContent(prompt);

    const text =
      result?.response?.candidates?.[0]?.content?.parts?.[0]?.text ??
      result?.response?.text() ??
      "";

    return text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("AI service is currently unavailable.");
  }
}

// Detect device type
function getDeviceType() {
  const ua = navigator.userAgent.toLowerCase();
  if (/mobile|android|iphone|ipad|ipod/.test(ua)) return "mobile";
  return "desktop";
}

export function Chat() {
  const { roomId } = useParams();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isBotReplying, setIsBotReplying] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(true);


  const [apiStatus, setApiStatus] = useState("checking");
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);


  const scrollToBottom = () => {
    const container = messagesContainerRef.current;
    if (container) {
      const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
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
     await addDoc(collection(db,`rooms/${roomId}/messages`), newMessageObj); 
    setInput(""); 
    await sendBotReply( input, roomId, messages ); 
    scrollToBottom(); 
  };



  const MessageItem = ({ index, style }) => {
    const message = messages[index];
    return (
      <div style={style} className="p-2 border-b">
        <strong>{message.user}:</strong> {message.text}
      </div>
    )
   
  };


  const handleEmojiClick = (emojiObject) => {
    setInput(prev => prev + emojiObject.emoji);
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

    } catch (error) {
      console.error("Error getting AI response:", error);

      const fallbackMessage = {
        userId: "AI",
        user: "AI Assistant",
        text:
          "⚠️ AI service is unavailable. Please try again later, or continue chatting.",
        timestamp: serverTimestamp(),
        isAI: true,
      };

      await addDoc(collection(db, `rooms/${roomId}/messages`), aiMessage);
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
        Random:
          "Welcome to Random! Expect the unexpected here! 🎲",
        Gaming:
          "Welcome to Gaming! Ready to talk about your favorite games? 🎮",
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

  return (
    <div className="flex flex-col h-screen">
      {/* Chat Messages */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-100">
        {loadingMessages ? (
          <div className="flex justify-center items-center h-full">
            <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
            <span className="ml-2 text-gray-600">Loading messages...</span>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "p-2 rounded-lg max-w-lg",
                msg.isAI
                  ? "bg-blue-100 self-start"
                  : msg.isCurrentUser
                  ? "bg-green-100 self-end"
                  : "bg-white self-start"
              )}
            >
              <strong>{msg.user}: </strong>
              <ReactMarkdown>{msg.text}</ReactMarkdown>
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

      <div className="input-container relative">


      {/* Input Area */}
      <div className="p-4 bg-white flex items-center space-x-2 border-t">
        <button
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className="p-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          title="Add emoji"
          disabled={isBotReplying}
        >
          <IoMdHappy size={20} />
        </button>
        {showEmojiPicker && (
          <div className="absolute bottom-full right-0 mb-2 z-10">
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

          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className="ml-2 p-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          title="Add emoji"
        >
          <IoMdHappy size={20} />
        </button>
        <button 
          onClick={handleSend}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg"
          disabled={isBotReplying}
        >
          {isBotReplying ? (
            <span className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-transparent border-t-white rounded-full animate-spin" />
              <span>AI Thinking...</span>
            </span>
          ) : (
            'Send'
          )}


        </button>
        {showEmojiPicker && (
          <div className="absolute bottom-full right-0 mb-2 z-10">
            <EmojiPicker onEmojiClick={handleEmojiClick} />
          </div>
        )}
      </div>
    </div>
    </div>
  );
}
