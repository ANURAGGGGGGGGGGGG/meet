"use client";

import { useState, useRef, useEffect } from "react";
import type { Message } from "@/hooks/useWebRTC";

type Props = {
  messages: Message[];
  onSend: (text: string) => void;
  onClose: () => void;
};

export default function Chat({ messages, onSend, onClose }: Props) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    onSend(input.trim());
    setInput("");
  }

  return (
    <>
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800/60">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500" />
          <h3 className="text-sm font-medium text-gray-200">Messages</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-gray-800/80 rounded-lg transition-all duration-300 text-gray-400 hover:text-white"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 text-sm py-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/10 to-purple-600/10 flex items-center justify-center mx-auto mb-3">
              <svg className="w-5 h-5 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            No messages yet
          </div>
        )}
        {messages.map((msg) => (
          <div key={msg.id || `${msg.senderId}-${msg.timestamp}`} className={`flex ${msg.senderId === "local" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                msg.senderId === "local"
                  ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-br-md shadow-lg shadow-blue-600/20"
                  : "bg-gray-800/80 text-gray-200 rounded-bl-md border border-gray-700/30"
              }`}
            >
              {msg.senderId !== "local" && (
                <p className="text-xs text-blue-400 font-medium mb-1">{msg.senderName}</p>
              )}
              <p className="text-sm leading-relaxed break-words">{msg.message}</p>
              <p className={`text-xs mt-1 ${msg.senderId === "local" ? "text-blue-200/60" : "text-gray-500"}`}>
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="p-3 border-t border-gray-800/60">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2.5 bg-gray-800/80 border border-gray-700/50 rounded-xl text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="p-2.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all duration-300 text-white shadow-lg shadow-blue-600/20"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19V5m0 0l-7 7m7-7l7 7" />
            </svg>
          </button>
        </div>
      </form>
    </>
  );
}
