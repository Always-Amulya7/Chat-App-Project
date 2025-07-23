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
    <div
      className="relative flex size-full min-h-screen flex-col group/design-root overflow-x-hidden p-4"
      style={{ fontFamily: '"Work Sans", "Noto Sans", sans-serif' }}
    >
      <div className="layout-container flex h-full grow flex-col">
        <div className="px-4 md:px-40 flex flex-1 justify-center py-5">
          <div className="layout-content-container flex flex-col w-[512px] max-w-[512px] py-5 px-4 flex-1">
            <h1 className="tracking-light text-[32px] font-bold leading-tight px-4 text-center pb-4 pt-6">
              Welcome to Chat! ✨ 💬
            </h1>

            <div className="flex max-w-[480px] flex-wrap items-end gap-4 px-4 py-4">
              <label className="flex flex-col min-w-40 flex-1">
                <input
                  placeholder="Enter a room name..."
                  value={room}
                  onChange={(e) => setRoom(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg focus:outline-0 focus:ring-0 border h-14 p-4 text-base font-normal leading-normal transition-colors"
                />
              </label>
            </div>

            <div className="flex px-4 py-4">
              <button
                onClick={handleEnterChat}
                className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-6 flex-1 text-sm font-bold leading-normal tracking-[0.015em] hover:opacity-90 transition-all bg-primary"
              >
                <span className="truncate">Enter Chat 🚪</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
