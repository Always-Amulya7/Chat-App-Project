import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db, auth } from "../firebase-config";
import { useAuth } from "../contexts/AuthContext";
import { cn } from "../lib/utils";
import {
  collection,
  addDoc,
  where,
  serverTimestamp,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";

function getBotReply(userMsg) {
  const msg = userMsg.toLowerCase();

  // Message Reactions
  if (msg.includes("love") || msg.includes("❤️"))
    return "Aww, sending you lots of ❤️!";
  if (msg.includes("happy") || msg.includes("good job"))
    return "😊 That makes me happy too!";
  if (msg.includes("sad") || msg.includes("cry"))
    return "Oh no! 😢 If you want to talk, I'm here.";

  // Random Fun Facts / Quotes
  if (msg.includes("fact") || msg.includes("quote")) {
    const facts = [
      "Did you know? Honey never spoils!",
      "“The best way to get started is to quit talking and begin doing.” – Walt Disney",
      "Fun fact: Bananas are berries, but strawberries aren't!",
      "“Keep your face always toward the sunshine—and shadows will fall behind you.” – Walt Whitman",
    ];
    return facts[Math.floor(Math.random() * facts.length)];
  }

  // Reminders
  if (msg.includes("remind") || msg.includes("reminder")) {
    return "Don't forget to drink water and take a short break! 💧🕒";
  }

  // Mood Journal (simple version)
  if (msg.includes("mood:")) {
    const mood = msg.split("mood:")[1]?.trim();
    if (mood) {
      // In a real app, you could save this to Firestore with a timestamp and user
      return `Mood saved: "${mood}". Remember, it's okay to feel how you feel!`;
    }
    return "Please tell me your mood after 'mood:'. For example, 'mood: happy'";
  }

  // Basic conversation
  if (msg.includes("hi") || msg.includes("hello"))
    return "Hello! What's your name?";
  if (msg.includes("my name is")) {
    const name = msg.split("my name is")[1]?.trim().split(" ")[0];
    return name
      ? `Nice to meet you, ${name}! How are you today?`
      : "Nice to meet you! How are you today?";
  }
  if (msg.includes("how are you"))
    return "I'm just a bot, but I'm doing well! How about you?";
  if (msg.includes("good") || msg.includes("fine") || msg.includes("great"))
    return "That's wonderful to hear!";
  if (msg.includes("bad") || msg.includes("not well") || msg.includes("sad"))
    return "I'm sorry to hear that. If you want to talk, I'm here!";
  if (msg.includes("bye")) return "Goodbye! Have a great day!";

  // Default fallback
  return "Let's keep chatting! You can say hi, tell me your name, ask for a fact, or type 'mood: happy'.";
}

async function sendBotReply(messagesRef, room, userMsg) {
  setTimeout(async () => {
    await addDoc(messagesRef, {
      text: getBotReply(userMsg),
      createdAt: serverTimestamp(),
      user: "ChatBot",
      room,
    });
  }, 800);
}

export const Chat = ({ dark }) => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const room = decodeURIComponent(roomId);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesRef = collection(db, "messages");
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const queryMessages = query(
      messagesRef,
      where("room", "==", room),
      orderBy("createdAt")
    );
    const unsubscribe = onSnapshot(queryMessages, (snapshot) => {
      let messages = [];
      snapshot.forEach((doc) => {
        messages.push({ ...doc.data(), id: doc.id });
      });
      setMessages(messages);
      console.log("Fetched messages:", messages);
    });
    return () => unsubscribe();
  }, [room]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (newMessage.trim() === "") return;
    await addDoc(messagesRef, {
      text: newMessage,
      createdAt: serverTimestamp(),
      user: user?.displayName || "Anonymous",
      room,
    });
    sendBotReply(messagesRef, room, newMessage); // <-- Call it here, right after sending the user message
    setNewMessage("");
  };

  return (
    <div className="relative flex size-full min-h-screen flex-col group/design-root overflow-x-hidden p-4">
      <div className="layout-container flex h-full grow flex-col">
        <div className="px-4 md:px-40 flex flex-1 justify-center py-5">
          <div className="layout-content-container flex flex-col  flex-1 space-y-6">
            {/* Messages */}
            <div className="flex flex-col gap-0 max-h-[500px] overflow-y-auto border rounded-lg p-4">
              {messages.map((message, index) => {
                console.log(message.user);
                const isCurrentUser =
                  message.user === (user?.displayName || "Anonymous");
                const isSystemMessage =
                  message.user === "ChatBot" || message.user === "System";

                return (
                  <div
                    key={message.id}
                    className={cn(
                      "flex items-end gap-3 p-4",
                      isCurrentUser && !isSystemMessage && "justify-end"
                    )}
                  >
                    {!isCurrentUser && (
                      <div
                        className="bg-center bg-no-repeat aspect-square bg-cover rounded-full w-10 shrink-0"
                        style={{
                          backgroundImage: isSystemMessage
                            ? `url("https://ui-avatars.com/api/?name=🤖")`
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
                        isCurrentUser && !isSystemMessage
                          ? "items-end"
                          : "items-start"
                      )}
                    >
                      <p
                        className={cn(
                          "font-normal leading-normal max-w-sm text-muted-foreground",
                          isCurrentUser && !isSystemMessage && "text-right"
                        )}
                      >
                        {message.user ?? "Anonymous"}{" "}
                      </p>
                      <p
                        className={cn(
                          "text-base font-normal leading-normal flex max-w-sm rounded-lg px-4 py-3",
                          isCurrentUser && !isSystemMessage
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-foreground"
                        )}
                      >
                        {message.text}
                      </p>
                    </div>

                    {isCurrentUser && !isSystemMessage && (
                      <div
                        className="bg-center bg-no-repeat aspect-square bg-cover rounded-full w-10 shrink-0"
                        style={{
                          backgroundImage: user?.photoURL
                            ? `url("${user.photoURL}")`
                            : `url("https://via.placeholder.com/40x40/0a52c6/ffffff?text=${
                                user?.displayName?.[0] || "U"
                              }")`,
                        }}
                      ></div>
                    )}
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <form onSubmit={handleSubmit} className="mt-4">
              <div className="flex items-center px-4 py-4 gap-4 rounded-lg border">
                <div
                  className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 shrink-0"
                  style={{
                    backgroundImage: user?.photoURL
                      ? `url("${user.photoURL}")`
                      : `url("https://ui-avatars.com/api/?name=${
                          user?.displayName?.[0] || "U"
                        }")`,
                  }}
                ></div>

                <label className="flex flex-col min-w-40 h-12 flex-1">
                  <div className="flex w-full flex-1 items-stretch rounded-lg h-full">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(event) => setNewMessage(event.target.value)}
                      placeholder="Type your message..."
                      className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg focus:outline-0 focus:ring-0 border-none h-full px-4 rounded-r-none border-r-0 pr-2 text-base font-normal leading-normal transition-colors"
                    />
                    <div className="flex border-none items-center justify-center rounded-r-lg border-l-0 !pr-2 bg-muted">
                      <div className="flex items-center gap-4 justify-end">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            className="flex items-center justify-center p-1.5 hover:bg-gray-200 rounded transition-colors"
                          >
                            <div
                              data-icon="Image"
                              data-size="20px"
                              data-weight="regular"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="20px"
                                height="20px"
                                fill="currentColor"
                                viewBox="0 0 256 256"
                              >
                                <path d="M216,40H40A16,16,0,0,0,24,56V200a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A16,16,0,0,0,216,40Zm0,16V158.75l-26.07-26.06a16,16,0,0,0-22.63,0l-20,20-44-44a16,16,0,0,0-22.62,0L40,149.37V56ZM40,172l52-52,80,80H40Zm176,28H194.63l-36-36,20-20L216,181.38V200ZM144,100a12,12,0,1,1,12,12A12,12,0,0,1,144,100Z"></path>
                              </svg>
                            </div>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </label>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
