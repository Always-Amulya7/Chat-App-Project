import React, { useState, useEffect, useRef, useMemo } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { cn } from "../lib/utils";
import EmojiPicker from "emoji-picker-react";
import { IoMdHappy } from "react-icons/io";
import ReactMarkdown from "react-markdown";
import trainingData from "../lib/trainingData.json";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { FixedSizeList as List } from "react-window";

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
  try {
    const roomContext = getRoomContext(roomName);
    const conversationHistory = chatHistory
      .slice(-10)
      .map((msg) => `${msg.user}: ${msg.text}`)
      .join("\n");

    const sampleQuestion = getRandomSampleQuestion(roomName);
    const exampleContext = sampleQuestion
      ? `\n\nExample interaction in this room:\nUser: ${sampleQuestion.question}\nAssistant: ${sampleQuestion.response}`
      : "";

    const prompt = `${roomContext}${exampleContext}

Previous conversation:
${conversationHistory}

User just said: ${userMsg}

Please respond naturally as if you're participating in this ${roomName} chat room. Keep responses conversational and engaging, matching the style of the example provided. Be concise but helpful.`;

    const result = await model.generateContent(prompt);

    const text =
      result?.response?.candidates?.[0]?.content?.parts?.[0]?.text ||
      result?.response?.text() ||
      "";

    if (!text) {
      throw new Error("Invalid response format from Gemini API");
    }

    return text;
  } catch (err) {
    console.error("Gemini API request failed:", err.message || err);
    throw err;
  }
}

async function getAIResponse(userMsg, roomName, chatHistory) {
  try {
    console.log("Attempting to get AI response for:", userMsg);

    const trainingMatch = findBestMatch(userMsg, roomName);
    if (trainingMatch) {
      console.log("Found training data match");
      return trainingMatch;
    }

    if (!import.meta.env.VITE_API_GENERATIVE_LANGUAGE_CLIENT) {
      console.warn("No Gemini API key found, using training data");
      return getRandomTrainingResponse(roomName);
    }

    console.log("Attempting Gemini API call");
    const geminiResponse = await getGeminiResponse(userMsg, roomName, chatHistory);
    console.log("Gemini API success");
    return geminiResponse;
  } catch (error) {
    console.error("AI Response Error:", error);

    const fallbackResponse = getRandomSampleQuestion(roomName);
    return fallbackResponse
      ? fallbackResponse.response
      : getRandomTrainingResponse(roomName);
  }
}

async function sendBotReply(userMsg, roomName, chatHistory, setMessages, setIsBotReplying) {
  setIsBotReplying(true);

  try {
    const aiResponse = await getAIResponse(userMsg, roomName, chatHistory);

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now() + "-bot",
        user: "AI Assistant",
        text: aiResponse,
        timestamp: new Date(),
        isAI: true,
      },
    ]);
  } catch (error) {
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now() + "-error",
        user: "AI Assistant",
        text: "Sorry, I encountered an error. Please try again!",
        timestamp: new Date(),
        isAI: true,
      },
    ]);
  } finally {
    setIsBotReplying(false);
  }
}

const Chat = ({ dark }) => {
  const { roomId } = useParams();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isBotReplying, setIsBotReplying] = useState(false);

  // Load messages from Firebase (placeholder)
  useEffect(() => {
    // Load messages logic here
  }, [roomId]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const newMessage = {
      id: Date.now(),
      user: user?.displayName || "Anonymous",
      text: input,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newMessage]);
    setInput('');
    await sendBotReply(input, roomId, messages, setMessages, setIsBotReplying);
  };

  const MessageItem = ({ index, style }) => {
    const message = messages[index];
    return (
      <div style={style} className="p-2 border-b">
        <strong>{message.user}:</strong> {message.text}
      </div>
    );
  };

  return (
    <div className="chat-container">
      <div className="messages-container">
        <List
          height={400}
          itemCount={messages.length}
          itemSize={60}
          width="100%"
        >
          {MessageItem}
        </List>
      </div>
      <div className="input-container">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyPress={e => e.key === 'Enter' && handleSend()}
          placeholder="Type a message..."
          className="w-full p-2 border rounded"
        />
        <button onClick={handleSend} disabled={isBotReplying} className="ml-2 p-2 bg-blue-500 text-white rounded">
          Send
        </button>
      </div>
    </div>
  );
};

export { Chat };
