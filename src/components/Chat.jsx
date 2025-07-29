import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { db } from "../firebase-config";
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

  if (msg.includes("love") || msg.includes("❤️"))
    return "Aww, sending you lots of ❤️!";
  if (msg.includes("happy") || msg.includes("good job"))
    return "😊 That makes me happy too!";
  if (msg.includes("sad") || msg.includes("cry"))
    return "Oh no! 😢 If you want to talk, I'm here.";

  if (msg.includes("fact") || msg.includes("quote")) {
    const facts = [
      "Did you know? Honey never spoils!",
      "“The best way to get started is to quit talking and begin doing.” – Walt Disney",
      "Fun fact: Bananas are berries, but strawberries aren't!",
      "“Keep your face always toward the sunshine—and shadows will fall behind you.” – Walt Whitman",
    ];
    return facts[Math.floor(Math.random() * facts.length)];
  }

  if (msg.includes("remind") || msg.includes("reminder")) {
    return "Don't forget to drink water and take a short break! 💧🕒";
  }

  if (msg.includes("mood:")) {
    const mood = msg.split("mood:")[1]?.trim();
    if (mood) {
      return `Mood saved: "${mood}". Remember, it's okay to feel how you feel!`;
    }
    return "Please tell me your mood after 'mood:'. For example, 'mood: happy'";
  }

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
  const { user } = useAuth();
  const room = decodeURIComponent(roomId);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesRef = collection(db, "messages");
  const bottomRef = useRef(null);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const q = query(
      messagesRef,
      where("room", "==", room),
      orderBy("createdAt")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      }));
      setMessages(fetched);
    });

    return () => unsubscribe();
  }, [room]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (newMessage.trim() === "") return;
    console.log("Adding messages: ")

    setNewMessage("");

    await addDoc(messagesRef, {
      text: newMessage,
      createdAt: serverTimestamp(),
      user: user?.displayName || "Anonymous",
      room,
    });
    console.log("message added")

    sendBotReply(messagesRef, room, newMessage);
    
  };

  return (
    <div className="relative flex size-full min-h-screen flex-col overflow-x-hidden p-4 ">
      <div className="layout-container flex h-full grow flex-col">
        <div className="px-4 md:px-40 flex flex-1 justify-center py-5">
          <div className="layout-content-container flex flex-col flex-1 space-y-6">

            {/* Messages */}
            <div className="flex flex-col gap-0 max-h-[500px] overflow-y-auto border rounded-lg p-4">
              {messages.map((message) => {
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
                        {message.user ?? "Anonymous"}
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
              <div ref={bottomRef} />
            </div>

            {/* Input */}
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
                  <div className="flex w-full items-stretch rounded-lg h-full">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type your message..."
                      className="form-input flex w-full resize-none overflow-hidden rounded-l-lg border-none px-4 text-base focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-lg bg-white text-black dark:bg-gray-700 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                    >
                      Send
                    </button>
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