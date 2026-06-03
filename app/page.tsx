"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Orb from "@/components/Orb";
import BorderGlow from "@/components/BorderGlow";


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
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gray-950">
      <Orb
        hoverIntensity={3}
        rotateOnHover
        hue={0}
        forceHoverState={false}
        backgroundColor="#030712"
      />

      <div className="w-full max-w-md relative z-10 px-4">
        <div className="text-center mb-10 animate-slide-up">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg shadow-blue-500/25 mb-6 animate-float">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-5xl font-bold mb-3 text-gradient">MeetFlow</h1>
          <p className="text-gray-400 text-sm">Free, secure, peer-to-peer video calls</p>
        </div>

        <BorderGlow
          edgeSensitivity={30}
          glowColor="40 80 80"
          backgroundColor="#030712"
          borderRadius={28}
          glowRadius={40}
          glowIntensity={1}
          coneSpread={25}
          animated={false}
          colors={["#c084fc", "#f472b6", "#38bdf8"]}
          className="animate-slide-up"
          style={{ animationDelay: "0.15s", animationFillMode: "both" } as React.CSSProperties}
        >
          <div className="p-8">
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">Your Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-4 py-3 bg-gray-800/80 border border-gray-700/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300"
                onKeyDown={(e) => e.key === "Enter" && createRoom()}
              />
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-900/30 border border-red-800/40 rounded-xl text-red-300 text-sm animate-slide-up flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            <button
              onClick={createRoom}
              disabled={creating}
              className="btn-19 w-full mb-4"
            >
              <span className="text-container">
                <span className="text">
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
                </span>
              </span>
            </button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-800/60" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-gray-900 px-4 text-xs text-gray-500 uppercase tracking-widest">or</span>
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
                  className="flex-1 px-4 py-3 bg-gray-800/80 border border-gray-700/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300"
                  onKeyDown={(e) => e.key === "Enter" && joinRoom()}
                />
                <button
                  onClick={joinRoom}
                  className="px-6 py-3 bg-gray-800 hover:bg-gray-700/80 border border-gray-700/50 text-white font-medium rounded-xl transition-all duration-300 hover:border-gray-600/50"
                >
                  Join
                </button>
              </div>
            </div>
          </div>
        </BorderGlow>

        <p className="text-center text-gray-600 text-xs mt-6 animate-fade-in" style={{ animationDelay: "0.4s", animationFillMode: "both" }}>
          End-to-end encrypted &middot; No data stored &middot; Open source
        </p>
      </div>
    </div>
  );
}
