import React, { useState, useEffect } from "react";
import { Chat } from "./components/Chat";
import { Auth } from "./components/Auth.js";
import { AppWrapper } from "./components/AppWrapper";
import Cookies from "universal-cookie";
import "./App.css";
import { db } from "./firebase-config";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

const cookies = new Cookies();
const messagesRef = collection(db, "messages");

function ChatApp() {
  const [isAuth, setIsAuth] = useState(cookies.get("auth-token"));
  const [isInChat, setIsInChat] = useState(null);
  const [room, setRoom] = useState("");
  const [dark, setDark] = useState(false);

  useEffect(() => {
    document.body.className = dark ? "dark" : "";
  }, [dark]);

  function getBotReply(userMsg) {
    const msg = userMsg.toLowerCase();
    if (msg.includes("hello") || msg.includes("hi")) return "Hello! 👋 How can I help you?";
    if (msg.includes("help")) return "I'm here to assist you. Try saying 'hello'!";
    if (msg.includes("bye")) return "Goodbye! 👋";
    return "I'm a simple bot. Try saying 'hello', 'help', or 'bye'!";
  }

  async function sendBotReply(room, userMsg) {
    setTimeout(async () => {
      await addDoc(messagesRef, {
        text: getBotReply(userMsg),
        createdAt: serverTimestamp(),
        user: "ChatBot",
        room,
      });
    }, 800);
  }

  if (!isAuth) {
    return (
      <AppWrapper
        isAuth={isAuth}
        setIsAuth={setIsAuth}
        setIsInChat={setIsInChat}
      >
        <button
          className="theme-toggle"
          onClick={() => setDark((d) => !d)}
          title="Toggle theme"
        >
          {dark ? "🌙" : "☀️"}
        </button>
        <Auth setIsAuth={setIsAuth} />
      </AppWrapper>
    );
  }

  return (
    <AppWrapper isAuth={isAuth} setIsAuth={setIsAuth} setIsInChat={setIsInChat}>
      <button
        className="theme-toggle"
        onClick={() => setDark((d) => !d)}
        title="Toggle theme"
      >
        {dark ? "🌙" : "☀️"}
      </button>
      {!isInChat ? (
        <div className="room">
          <label>
            <span role="img" aria-label="sparkle" style={{ fontSize: "2rem", verticalAlign: "middle" }}>✨</span>
            &nbsp;Welcome! Join a Room&nbsp;
            <span role="img" aria-label="chat" style={{ fontSize: "2rem", verticalAlign: "middle" }}>💬</span>
          </label>
          <input
            placeholder="Enter a room name..."
            onChange={(e) => setRoom(e.target.value)}
            style={{
              background: "rgba(255,255,255,0.95)",
              border: "2px solid #74ebd5",
              boxShadow: "0 2px 16px #74ebd555",
              fontWeight: 500,
              color: "#3b5998",
              transition: "all 0.2s"
            }}
          />
          <button
            onClick={() => {
              setIsInChat(true);
            }}
            style={{
              background: "linear-gradient(90deg, #74ebd5 0%, #3b5998 100%)",
              color: "#fff",
              fontWeight: 700,
              fontSize: "1.2rem",
              border: "none",
              borderRadius: "12px",
              marginTop: "10px",
              boxShadow: "0 4px 24px #74ebd555",
              letterSpacing: "1px",
              padding: "12px 0",
              cursor: "pointer",
              transition: "all 0.2s"
            }}
            onMouseOver={e => e.currentTarget.style.background = "linear-gradient(90deg, #3b5998 0%, #74ebd5 100%)"}
            onMouseOut={e => e.currentTarget.style.background = "linear-gradient(90deg, #74ebd5 0%, #3b5998 100%)"}
          >
            <span role="img" aria-label="door">🚪</span> Enter Chat
          </button>
        </div>
      ) : (
        <Chat room={room} dark={dark} />
      )}
    </AppWrapper>
  );
}

export default ChatApp;
