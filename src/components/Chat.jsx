import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { cn } from "../lib/utils";
import EmojiPicker from "emoji-picker-react";
import { IoMdHappy } from "react-icons/io";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import trainingData from "../lib/trainingData.json";

// Training data helper functions
function findBestMatch(userMessage, roomName) {
  const questions = trainingData.trainingQuestions[roomName] || [];
  const normalizedInput = userMessage.toLowerCase().trim();
  
  // Look for exact or partial matches
  for (const item of questions) {
    const normalizedQuestion = item.question.toLowerCase();
    
    // Check for exact match or high similarity
    if (normalizedQuestion.includes(normalizedInput) || 
        normalizedInput.includes(normalizedQuestion) ||
        calculateSimilarity(normalizedInput, normalizedQuestion) > 0.6) {
      return item.response;
    }
  }
  
  return null;
}

function calculateSimilarity(str1, str2) {
  const words1 = str1.split(' ');
  const words2 = str2.split(' ');
  const commonWords = words1.filter(word => words2.includes(word));
  return commonWords.length / Math.max(words1.length, words2.length);
}

function getRandomSampleQuestion(roomName) {
  const questions = trainingData.trainingQuestions[roomName] || [];
  if (questions.length === 0) return null;
  return questions[Math.floor(Math.random() * questions.length)];
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
  return trainingData.contextPrompts[roomName] || 
    "You are a helpful assistant. Be friendly and helpful with any topics users want to discuss.";
}

async function getAIResponse(userMsg, roomName, chatHistory) {
  try {
    // First, check if we have a training data match
    const trainingMatch = findBestMatch(userMsg, roomName);
    if (trainingMatch) {
      return trainingMatch;
    }

    // If no training match, use AI API
    const roomContext = getRoomContext(roomName);
    const conversationHistory = chatHistory.slice(-10).map(msg =>
      `${msg.user}: ${msg.text}`
    ).join('\n');

    // Include training examples in the context for better responses
    const sampleQuestion = getRandomSampleQuestion(roomName);
    const exampleContext = sampleQuestion ? 
      `\n\nExample interaction in this room:\nUser: ${sampleQuestion.question}\nAssistant: ${sampleQuestion.response}` : '';

    const prompt = `${roomContext}${exampleContext}

Previous conversation:
${conversationHistory}

User just said: ${userMsg}

Please respond naturally as if you're participating in this ${roomName} chat room. Keep responses conversational and engaging, matching the style of the example provided.`;

    const response = await axios({
      url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${
        import.meta.env.VITE_API_GENERATIVE_LANGUAGE_CLIENT
      }`,
      method: "post",
      data: {
        contents: [{ parts: [{ text: prompt }] }],
      },
    });

    return response["data"]["candidates"][0]["content"]["parts"][0]["text"];
  } catch (error) {
    console.error("AI Response Error:", error);
    // Fallback to a training response if API fails
    const fallbackResponse = getRandomSampleQuestion(roomName);
    return fallbackResponse ? 
      fallbackResponse.response : 
      "Sorry, I'm having trouble responding right now. Please try again!";
  }
}

async function sendBotReply(userMsg, roomName, chatHistory, setMessages) {
  // Add typing indicator
  const typingId = Date.now() + "-typing";
  setMessages(prev => [...prev, {
    id: typingId,
    user: "AI Assistant",
    text: "Thinking...",
    timestamp: new Date(),
    isTypingIndicator: true
  }]);

  try {
    const aiResponse = await getAIResponse(userMsg, roomName, chatHistory);

    // Remove typing indicator and add actual response
    setMessages(prev => {
      const filtered = prev.filter(msg => msg.id !== typingId);
      return [...filtered, {
        id: Date.now() + "-ai",
        user: "AI Assistant",
        text: aiResponse,
        timestamp: new Date(),
        isAI: true
      }];
    });
  } catch (error) {
    // Remove typing indicator and add error message
    setMessages(prev => {
      const filtered = prev.filter(msg => msg.id !== typingId);
      return [...filtered, {
        id: Date.now() + "-error",
        user: "AI Assistant",
        text: "Sorry, I encountered an error. Please try again!",
        timestamp: new Date(),
        isAI: true
      }];
    });
  }
}

export const Chat = ({ dark }) => {
  const { roomId } = useParams();
  const { user } = useAuth();
  const room = decodeURIComponent(roomId);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [showSampleQuestions, setShowSampleQuestions] = useState(false);
  const bottomRef = useRef(null);
  const containerRef = useSeenTracker(messages, user);

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const inputRef = useRef(null);

  const handleEmojiClick = (emojiData) => {
    const cursorPos = inputRef.current.selectionStart;
    const textBefore = newMessage.substring(0, cursorPos);
    const textAfter = newMessage.substring(cursorPos);
    setNewMessage(textBefore + emojiData.emoji + textAfter);

    setTimeout(() => {
      inputRef.current.focus();
      inputRef.current.selectionStart = cursorPos + emojiData.emoji.length;
      inputRef.current.selectionEnd = cursorPos + emojiData.emoji.length;
    }, 0);
  };

  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);

  const handleInputChange = (e) => {
    setNewMessage(e.target.value);

    if (!isTyping) setIsTyping(true);

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 1500);
  };

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize chat with welcome message based on room
  useEffect(() => {
    if (room) {
      const welcomeMessages = {
        "General": "Welcome to the General chat room! Feel free to discuss anything here. 💬",
        "Tech Talk": "Welcome to Tech Talk! Let's dive into all things technology. 💻",
        "Random": "Welcome to Random! Expect the unexpected here! 🎲",
        "Gaming": "Welcome to Gaming! Ready to talk about your favorite games? 🎮"
      };

      const welcomeMessage = welcomeMessages[room] || `Welcome to ${room}! Start chatting below.`;

      setMessages([{
        id: "welcome-" + Date.now(),
        user: "AI Assistant",
        text: welcomeMessage,
        timestamp: new Date(),
        isAI: true,
        isWelcome: true
      }]);
    }
  }, [room]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (newMessage.trim() === "") return;

    const userMessage = {
      id: Date.now() + "-user",
      text: newMessage,
      user: user?.displayName || "Anonymous",
      userId: user?.uid,
      timestamp: new Date(),
      isCurrentUser: true
    };

    // Add user message immediately
    setMessages(prev => [...prev, userMessage]);

    const currentMessage = newMessage;
    setNewMessage("");
    setShowSampleQuestions(false);

    // Get AI response based on room context and training data
    await sendBotReply(currentMessage, room, messages, setMessages);
  };

  const handleSampleQuestionClick = (question) => {
    setNewMessage(question);
    setShowSampleQuestions(false);
    inputRef.current?.focus();
  };

  const getSampleQuestions = () => {
    const questions = trainingData.trainingQuestions[room] || [];
    return questions.slice(0, 3); // Show first 3 sample questions
  };

  return (
    <div className="relative flex size-full min-h-screen flex-col overflow-x-hidden p-4">
      <div className="layout-container flex h-full grow flex-col">
        <div className="px-4 md:px-40 flex flex-1 justify-center py-5">
          <div className="layout-content-container flex flex-col flex-1 space-y-6">

            {/* Room Header */}
            <div className="text-center py-4 border-b">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {room}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {room === "Tech Talk" && "Discuss technology, programming, and innovation"}
                {room === "Gaming" && "Talk about games, strategies, and gaming culture"}
                {room === "Random" && "Anything goes! Random discussions welcome"}
                {room === "General" && "General discussions and friendly conversations"}
                {!["Tech Talk", "Gaming", "Random", "General"].includes(room) && "Custom chat room for focused discussions"}
              </p>
              
              {/* Sample Questions Button */}
              <button
                onClick={() => setShowSampleQuestions(!showSampleQuestions)}
                className="mt-2 text-xs text-blue-500 hover:text-blue-700 underline"
              >
                {showSampleQuestions ? 'Hide' : 'Show'} sample questions
              </button>
              
              {/* Sample Questions Display */}
              {showSampleQuestions && (
                <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Try these questions:</p>
                  <div className="space-y-1">
                    {getSampleQuestions().map((item, index) => (
                      <button
                        key={index}
                        onClick={() => handleSampleQuestionClick(item.question)}
                        className="block w-full text-left text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        "{item.question}"
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Messages */}
            <div
              ref={containerRef}
              className="flex flex-col gap-0 max-h-[500px] overflow-y-auto border rounded-lg p-4 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm"
              style={{ height: "380px" }}
            >
              {messages.map((message) => {
                const isCurrentUser = message.isCurrentUser;
                const isAI = message.isAI || message.user === "AI Assistant";
                const isTypingIndicator = message.isTypingIndicator;

                return (
                  <div
                    key={message.id}
                    data-id={message.id}
                    data-user={message.user}
                    data-userid={message.userId}
                    className={cn(
                      "flex items-end gap-3 p-4",
                      isCurrentUser && !isAI && "justify-end",
                      isTypingIndicator && "opacity-60 italic"
                    )}
                  >
                    {!isCurrentUser && (
                      <div
                        className="bg-center bg-no-repeat aspect-square bg-cover rounded-full w-10 shrink-0"
                        style={{
                          backgroundImage: isAI
                            ? `url("https://ui-avatars.com/api/?name=🤖&background=4f46e5&color=ffffff")`
                            : `url("https://ui-avatars.com/api/?name=${
                                message.user?.[0]?.toUpperCase() || "U"
                              }")`,
                        }}
                        title={message.user || "Anonymous"}
                      ></div>
                    )}

                    <div
                      className={cn(
                        "flex flex-1 flex-col gap-1",
                        isCurrentUser && !isAI ? "items-end" : "items-start"
                      )}
                    >
                      <p
                        className={cn(
                          "font-normal leading-normal max-w-sm text-muted-foreground text-xs",
                          isCurrentUser && !isAI && "text-right"
                        )}
                      >
                        {message.user ?? "Anonymous"}
                      </p>
                      <div className="flex flex-col items-end">
                        <div
                          className={cn(
                            "text-base font-normal leading-normal flex max-w-sm rounded-lg px-4 py-3",
                            isCurrentUser && !isAI
                              ? "bg-blue-500 text-white"
                              : isAI
                              ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white"
                              : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                          )}
                        >
                          {isAI ? (
                            <div className="prose prose-sm max-w-none text-white">
                              <ReactMarkdown>
                                {message.text}
                              </ReactMarkdown>
                            </div>
                          ) : (
                            message.text
                          )}
                        </div>
                        {isCurrentUser && !isAI && (
                          <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <span className="text-blue-500">✔✔</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {isCurrentUser && !isAI && (
                      <div
                        className="bg-center bg-no-repeat aspect-square bg-cover rounded-full w-10 shrink-0"
                        style={{
                          backgroundImage: user?.photoURL
                            ? `url("${user.photoURL}")`
                            : `url("https://ui-avatars.com/api/?name=${
                                user?.displayName?.[0] || "U"
                              }&background=3b82f6&color=ffffff")`,
                        }}
                      ></div>
                    )}
                  </div>
                );
              })}

              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="mt-4">
              <div className="flex items-center px-4 py-4 gap-4 rounded-lg border bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm relative">
                {/* User avatar */}
                <div
                  className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 shrink-0"
                  style={{
                    backgroundImage: user?.photoURL
                      ? `url("${user.photoURL}")`
                      : `url("https://ui-avatars.com/api/?name=${
                          user?.displayName?.[0] || "U"
                        }&background=3b82f6&color=ffffff")`,
                  }}
                ></div>

                {/* Emoji Picker Button */}
                <div className="relative" style={{ overflow: "visible" }}>
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker((prev) => !prev)}
                    className="text-2xl hover:opacity-70 transition-opacity"
                  >
                    <IoMdHappy />
                  </button>

                  {showEmojiPicker && (
                    <div
                      className="absolute z-50"
                      style={{
                        bottom: "50px",
                        left: 0,
                      }}
                    >
                      <EmojiPicker
                        onEmojiClick={handleEmojiClick}
                        autoFocusSearch={false}
                      />
                    </div>
                  )}
                </div>

                {/* Message Input */}
                <label className="flex flex-col min-w-40 h-12 flex-1">
                  <div className="flex w-full items-stretch rounded-lg h-full">
                    <input
                      ref={inputRef}
                      type="text"
                      value={newMessage}
                      onChange={handleInputChange}
                      placeholder={`Type your message in ${room}...`}
                      className="form-input flex w-full resize-none overflow-hidden rounded-l-lg border-none px-4 text-base focus:outline-none bg-transparent"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSubmit(e);
                        }
                      }}
                    />
                    <button
                      type="submit"
                      disabled={!newMessage.trim() || messages.some(m => m.isTypingIndicator)}
                      className="px-6 py-2 rounded-r-lg bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-300 font-medium"
                    >
                      Send
                    </button>
                  </div>
                </label>
              </div>
            </form>

            {/* Room Info */}
            <div className="text-center text-sm text-gray-500 dark:text-gray-400">
              Connected to <span className="font-semibold text-blue-500">{room}</span> room
              {isTyping && (
                <span className="ml-2 text-green-500">
                  • You are typing...
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


/* iframe used chatbot
import React, { useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export const Chat = ({ dark }) => {
  const { roomId } = useParams();
  const { user } = useAuth();
  const room = decodeURIComponent(roomId);
  const [isTyping, setIsTyping] = useState(false);

  return (
    <div className="relative flex size-full min-h-screen flex-col overflow-x-hidden p-4">
      <div className="layout-container flex h-full grow flex-col">
        <div className="px-4 md:px-40 flex flex-1 justify-center py-5">
          <div className="layout-content-container flex flex-col flex-1 space-y-6">
            <div className="text-center py-4 border-b">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {room}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {room === "Tech Talk" &&
                  "Discuss technology, programming, and innovation"}
                {room === "Gaming" &&
                  "Talk about games, strategies, and gaming culture"}
                {room === "Random" &&
                  "Anything goes! Random discussions welcome"}
                {room === "General" &&
                  "General discussions and friendly conversations"}
                {!["Tech Talk", "Gaming", "Random", "General"].includes(room) &&
                  "Custom chat room for focused discussions"}
              </p>
            </div>

            <div className="w-full h-[600px]">
              {" "}
              <iframe
                src="https://www.chatbase.co/chatbot-iframe/CbMomx9y45n2z0CVpwZ1u"
                width="100%"
                height="100%"
                style={{ border: "none" }}
                title="Chatbase Bot"
              />
            </div>

            <div className="text-center text-sm text-gray-500 dark:text-gray-400">
              Connected to{" "}
              <span className="font-semibold text-blue-500">{room}</span> room
              {isTyping && (
                <span className="ml-2 text-green-500">• You are typing...</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
*/