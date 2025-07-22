import React, { useState, useEffect } from "react";
import { db, auth } from "../firebase-config";
import {
  collection,
  addDoc,
  where,
  serverTimestamp,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";

import "../styles/Chat.css";

function getBotReply(userMsg) {
  const msg = userMsg.toLowerCase();

  // Message Reactions
  if (msg.includes("love") || msg.includes("❤️")) return "Aww, sending you lots of ❤️!";
  if (msg.includes("happy") || msg.includes("good job")) return "😊 That makes me happy too!";
  if (msg.includes("sad") || msg.includes("cry")) return "Oh no! 😢 If you want to talk, I'm here.";

  // Random Fun Facts / Quotes
  if (msg.includes("fact") || msg.includes("quote")) {
    const facts = [
      "Did you know? Honey never spoils!",
      "“The best way to get started is to quit talking and begin doing.” – Walt Disney",
      "Fun fact: Bananas are berries, but strawberries aren't!",
      "“Keep your face always toward the sunshine—and shadows will fall behind you.” – Walt Whitman"
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
  if (msg.includes("hi") || msg.includes("hello")) return "Hello! What's your name?";
  if (msg.includes("my name is")) {
    const name = msg.split("my name is")[1]?.trim().split(" ")[0];
    return name ? `Nice to meet you, ${name}! How are you today?` : "Nice to meet you! How are you today?";
  }
  if (msg.includes("how are you")) return "I'm just a bot, but I'm doing well! How about you?";
  if (msg.includes("good") || msg.includes("fine") || msg.includes("great")) return "That's wonderful to hear!";
  if (msg.includes("bad") || msg.includes("not well") || msg.includes("sad")) return "I'm sorry to hear that. If you want to talk, I'm here!";
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

export const Chat = ({ room }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesRef = collection(db, "messages");

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
      user: auth.currentUser.displayName,
      room,
    });
    sendBotReply(messagesRef, room, newMessage); // <-- Call it here, right after sending the user message
    setNewMessage("");
  };

  return (
    <div className="chat-app">
      <div className="header">
        <h1>Welcome to: {room.toUpperCase()}</h1>
      </div>
      <div className="messages">
        {messages.map((message) => (
          <div key={message.id} className="message">
            <span className="user">{message.user}:</span> {message.text}
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="new-message-form">
        <input
          type="text"
          value={newMessage}
          onChange={(event) => setNewMessage(event.target.value)}
          className="new-message-input"
          placeholder="Type your message here..."
        />
        <button type="submit" className="send-button">
          Send
        </button>
      </form>
    </div>
  );
};
