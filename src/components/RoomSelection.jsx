import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export const RoomSelection = ({ dark }) => {
  const [room, setRoom] = useState("");
  const navigate = useNavigate();

  const handleEnterChat = () => {
    if (room.trim()) {
      navigate(`/chat/${encodeURIComponent(room.trim())}`);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleEnterChat();
    }
  };

  return (
    <div className="room">
      <label>
        <span
          role="img"
          aria-label="sparkle"
          className="room-emoji"
        >
          ✨
        </span>
        &nbsp;Welcome! Join a Room&nbsp;
        <span
          role="img"
          aria-label="chat"
          className="room-emoji"
        >
          💬
        </span>
      </label>
      <input
        placeholder="Enter a room name..."
        value={room}
        onChange={(e) => setRoom(e.target.value)}
        onKeyPress={handleKeyPress}
        className="room-input"
      />
      <button
        onClick={handleEnterChat}
        className="room-enter-button"
      >
        <span role="img" aria-label="door">
          🚪
        </span>{" "}
        Enter Chat
      </button>
    </div>
  );
};
