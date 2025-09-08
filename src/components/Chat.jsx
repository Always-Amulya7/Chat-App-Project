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

// 🔑 Initialize Gemini SDK
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_API_GENERATIVE_LANGUAGE_CLIENT);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

function findBestMatch(userMessage, roomName) {
  const questions = trainingData.trainingQuestions[roomName] || [];
  const normalizedInput = userMessage.toLowerCase().trim();

  for (const item of questions) {
    const normalizedQuestion = item.question.toLowerCase();

    if (
      normalizedQuestion.includes(normalizedInput) ||
      normalizedInput.includes(normalizedQuestion) ||
      calculateSimilarity(normalizedInput, normalizedQuestion) > 0.6
    ) {
      return item.response;
    }
  }

  return null;
}

function calculateSimilarity(str1, str2) {
  const words1 = str1.split(" ").filter((word) => word.length > 2); // Filter short words
  const words2 = str2.split(" ").filter((word) => word.length > 2);
  const commonWords = words1.filter((word) => words2.includes(word));
  return commonWords.length / Math.max(words1.length, words2.length);
}

function getRandomSampleQuestion(roomName) {
  const questions = trainingData.trainingQuestions[roomName] || [];
  if (questions.length === 0) return null;
  return questions[Math.floor(Math.random() * questions.length)];
}

function getRandomTrainingResponse(roomName) {
  const questions = trainingData.trainingQuestions[roomName] || [];
  if (questions.length === 0) return "I'm here to help! What would you like to talk about?";
  const randomItem = questions[Math.floor(Math.random() * questions.length)];
  return randomItem.response;
}

function useSeenTracker(messages, user) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || !user?.uid) return;

    const observer = new IntersectionObserver(
      async (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const messageId = entry.target.dataset.id;
            const messageUser = entry.target.dataset.user;

            // Mark message as seen (for local state management)
            if (messageUser !== (user?.displayName || "Anonymous")) {
              console.log("Message seen:", messageId);
            }
          }
        }
      },
      { threshold: 0.75 }
    );

    const messageEls = containerRef.current.querySelectorAll("[data-id]");
    messageEls.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [messages, user]);

  return containerRef;
}

function getRoomContext(roomName) {
  if (!trainingData || !trainingData.contextPrompts) {
    console.warn("No trainingData.contextPrompts found, defaulting to generic assistant");
    return "You are a helpful assistant. Be friendly and helpful with any topics users want to discuss.";
  }

  return (
    trainingData.contextPrompts[roomName] ||
    "You are a helpful assistant. Be friendly and helpful with any topics users want to discuss."
  );
}

async function getGeminiResponse(userMsg, roomName, chatHistory) {
import { db } from "../firebase";
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

export default function Chat() {
  const { roomId } = useParams();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isBotReplying, setIsBotReplying] = useState(false);

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(true);

  const [apiStatus, setApiStatus] = useState("checking");
  const messagesEndRef = useRef(null);


  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Firestore listener for messages
  useEffect(() => {

    setLoadingMessages(true);
    // Load messages logic here
    setLoadingMessages(false);
  }, [roomId]);

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
    };


  const handleEmojiClick = (emojiObject) => {
    setInput(prev => prev + emojiObject.emoji);
    setShowEmojiPicker(false);
  };

  const MessageItem = ({ index, style }) => {
    const message = messages[index];
    return (
      <div style={style} className="p-2 border-b">
        <strong>{message.user}:</strong> {message.text}
      </div>

    await addDoc(collection(db, `rooms/${roomId}/messages`), newMessageObj);
    setInput("");

    await sendBotReply(
      input,
      roomId,
      messages,
      setMessages,
      setIsBotReplying,
      apiStatus

    );

    scrollToBottom();
  };

  // Send AI reply
  const sendBotReply = async (
    userMessage,
    roomId,
    prevMessages,
    setMessages,
    setIsBotReplying,
    apiStatus
  ) => {
    setIsBotReplying(true);

    try {
      let replyText;

      if (apiStatus === "failed") {
        // Fallback: use local training data
        replyText =
          trainingData[userMessage.toLowerCase()] ??
          "Sorry, I can only reply with training data in offline mode.";
      } else {
        // Online: use Gemini API
        replyText = await getGeminiResponse(userMessage, prevMessages);
      }

      const aiMessage = {
        userId: "AI",
        user: "AI Assistant",
        text: replyText,
        timestamp: serverTimestamp(),
        isAI: true,
      };

      await addDoc(collection(db, `rooms/${roomId}/messages`), aiMessage);
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

      await addDoc(collection(db, `rooms/${roomId}/messages`), fallbackMessage);
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
        },
      ]);
    }
  }, [roomId, apiStatus]);

  return (

    <div className="chat-container">
      <div className="messages-container">
        {loadingMessages ? (
          <div className="flex justify-center items-center h-full">
            <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
            <span className="ml-2 text-gray-600">Loading messages...</span>
          </div>
        ) : (
          <List
            height={400}
            itemCount={messages.length}
            itemSize={60}
            width="100%"
          >
            {MessageItem}
          </List>
        )}
      </div>
      <div className="input-container relative">

    <div className="flex flex-col h-screen">
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-100">
        {messages.map((msg) => (
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
          </div>
        ))}
        {isBotReplying && (
          <div className="p-2 rounded-lg bg-blue-50 self-start italic">
            AI Assistant is typing...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white flex items-center space-x-2 border-t">
        <button onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
          <IoMdHappy className="text-2xl" />
        </button>
        {showEmojiPicker && (
          <EmojiPicker
            onEmojiClick={(e) => setInput(input + e.emoji)}
            className="absolute bottom-16"
          />
        )}

        <input
          className="flex-1 border rounded-lg p-2"
          value={input}

          onChange={e => setInput(e.target.value)}
          onKeyPress={e => e.key === 'Enter' && handleSend()}
          placeholder="Type a message..."
          className="w-full p-2 border rounded"
          disabled={isBotReplying}
        />
        <button
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className="ml-2 p-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          title="Add emoji"
          disabled={isBotReplying}
        >
          <IoMdHappy size={20} />
        </button>
        <button onClick={handleSend} disabled={isBotReplying} className="ml-2 p-2 bg-blue-500 text-white rounded">
          {isBotReplying ? (
            <span className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-transparent border-t-white rounded-full animate-spin" />
              <span>AI Thinking...</span>
            </span>
          ) : (
            'Send'
          )}

          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />
        <button
          onClick={handleSend}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg"
        >
          Send

        </button>
        {showEmojiPicker && (
          <div className="absolute bottom-full right-0 mb-2 z-10">
            <EmojiPicker onEmojiClick={handleEmojiClick} />
          </div>
        )}
      </div>
    </div>
  );
}
