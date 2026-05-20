"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Landing() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [roomInput, setRoomInput] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  async function createRoom() {
    if (!name.trim()) return setError("Please enter your name");
    setCreating(true);
    setError("");
    try {
      const res = await fetch("/api/create-room", { method: "POST" });
      const data = await res.json();
      router.push(`/room/${data.roomId}?name=${encodeURIComponent(name.trim())}`);
    } catch {
      setError("Failed to create room. Check connection.");
      setCreating(false);
    }
  }

  function joinRoom() {
    if (!name.trim()) return setError("Please enter your name");
    if (!roomInput.trim()) return setError("Enter a room code");
    router.push(`/room/${roomInput.trim()}?name=${encodeURIComponent(name.trim())}`);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 mb-6">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">MeetFlow</h1>
          <p className="text-gray-400">Free, secure, peer-to-peer video calls</p>
        </div>

        <div className="bg-gray-900/80 backdrop-blur-sm rounded-2xl p-8 border border-gray-800 shadow-2xl">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">Your Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              onKeyDown={(e) => e.key === "Enter" && createRoom()}
            />
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-900/50 border border-red-800 rounded-xl text-red-300 text-sm">{error}</div>
          )}

          <button
            onClick={createRoom}
            disabled={creating}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:opacity-50 text-white font-medium rounded-xl transition flex items-center justify-center gap-2 mb-4"
          >
            {creating ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Creating...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Meeting
              </>
            )}
          </button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-800" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-gray-900 px-4 text-sm text-gray-500">or</span>
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-300">Join with code</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={roomInput}
                onChange={(e) => setRoomInput(e.target.value)}
                placeholder="Enter room code"
                className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                onKeyDown={(e) => e.key === "Enter" && joinRoom()}
              />
              <button
                onClick={joinRoom}
                className="px-6 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white font-medium rounded-xl transition"
              >
                Join
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-gray-600 text-xs mt-6">End-to-end encrypted. No data stored. Open source.</p>
      </div>
    </div>
  );
}
