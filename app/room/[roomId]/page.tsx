"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import useWebRTC, { type Message } from "@/hooks/useWebRTC";
import { usePiPAuto } from "@/hooks/usePiPAuto";
import VideoTile from "@/components/VideoTile";
import Controls from "@/components/Controls";
import Chat from "@/components/Chat";
import MessagePopup from "@/components/MessagePopup";
import { disconnectSocket } from "@/lib/socket";

export default function Room() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const roomId = params.roomId as string;
  const [showChat, setShowChat] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [popupMessages, setPopupMessages] = useState<Message[]>([]);

  const initialName = searchParams.get("name") || "";
  const [userName, setUserName] = useState(initialName);
  const [joined, setJoined] = useState(!!initialName);
  const [autoFrame, setAutoFrame] = useState(false);

  const {
    participants,
    messages,
    mediaState,
    connectionStatus,
    localStream,
    addLocalParticipant,
    toggleCamera,
    toggleMic,
    toggleScreenShare,
    sendMessage,
    leaveRoom,
  } = useWebRTC(joined ? roomId : "", joined ? userName : "");

  const hasAddedLocal = useRef(false);
  const prevMessagesLen = useRef(0);

  useEffect(() => {
    if (messages.length > prevMessagesLen.current) {
      if (!showChat) {
        const newMessages = messages.slice(prevMessagesLen.current);
        setUnreadCount((c) => c + newMessages.length);
        setPopupMessages((prev) => [...prev, ...newMessages].slice(-3));
      }
    }
    prevMessagesLen.current = messages.length;
  }, [messages, showChat]);

  useEffect(() => {
    if (localStream.current && !hasAddedLocal.current) {
      hasAddedLocal.current = true;
      addLocalParticipant(localStream.current);
    }
  }, [localStream.current, addLocalParticipant]);

  useEffect(() => {
    if (connectionStatus === "no-media") {
      setConnectionError("no-media");
    } else if (connectionStatus === "error") {
      setConnectionError("connection-error");
    }
  }, [connectionStatus]);

  usePiPAuto({
    participants,
    enabled: connectionStatus === "connected" && participants.length > 0,
  });

  const handleLeave = useCallback(() => {
    leaveRoom();
    disconnectSocket();
    router.push("/");
  }, [leaveRoom, router]);

  const copyInviteLink = useCallback(() => {
    const link = `${window.location.origin}/room/${roomId}`;
    navigator.clipboard.writeText(link);
  }, [roomId]);

  const handleJoinNow = useCallback(() => {
    if (!userName.trim()) return;
    setJoined(true);
  }, [userName]);

  if (!joined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 mb-6">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Join Meeting</h1>
            <p className="text-gray-400">You&apos;re about to join room <span className="text-blue-400 font-mono">{roomId}</span></p>
          </div>

          <div className="bg-gray-900/80 backdrop-blur-sm rounded-2xl p-8 border border-gray-800 shadow-2xl">
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">Your Name</label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                onKeyDown={(e) => e.key === "Enter" && handleJoinNow()}
              />
            </div>

            <button
              onClick={handleJoinNow}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Join Now
            </button>
          </div>

          <p className="text-center text-gray-600 text-xs mt-6">End-to-end encrypted. No data stored.</p>
        </div>
      </div>
    );
  }

  if (connectionError) {
    const isMediaError = connectionError === "no-media";
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 p-4">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-yellow-900/50 border border-yellow-800 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">
            {isMediaError ? "Could not access media devices" : "Connection failed"}
          </h2>
          <p className="text-gray-400 mb-6 text-sm">
            {isMediaError
              ? "Please allow camera and microphone access in your browser settings."
              : "Could not connect to the server. Make sure the signaling server is running (npm run dev)."}
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => { setConnectionError(null); hasAddedLocal.current = false; window.location.reload(); }}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition text-sm font-medium"
            >
              Try Again
            </button>
            <button
              onClick={() => router.push("/")}
              className="px-6 py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-xl transition text-sm font-medium"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-950">
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col relative">
          {connectionStatus === "connecting" && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-950/90 z-20">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-4">
                  <span className="w-3 h-3 bg-blue-500 rounded-full animate-pulse-dot" />
                  <span className="w-3 h-3 bg-blue-500 rounded-full animate-pulse-dot" />
                  <span className="w-3 h-3 bg-blue-500 rounded-full animate-pulse-dot" />
                </div>
                <p className="text-gray-400 text-sm">Connecting to room...</p>
              </div>
            </div>
          )}

          <div className="flex-1 p-3 overflow-y-auto">
            <div className={`grid gap-3 h-full ${participants.length <= 1 ? "grid-cols-1" : participants.length === 2 ? "grid-cols-1 md:grid-cols-2" : participants.length <= 4 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"}`}>
              {participants.map((p) => (
                <VideoTile key={p.id} participant={p} isLocal={p.isLocal} localStream={p.isLocal ? localStream.current : null} enableAutoFrame={autoFrame && p.isLocal} />
              ))}
            </div>
          </div>

          <Controls
            mediaState={mediaState}
            toggleCamera={toggleCamera}
            toggleMic={toggleMic}
            toggleScreenShare={toggleScreenShare}
            showChat={showChat}
            setShowChat={(v) => { setShowChat(v); if (v) setUnreadCount(0); }}
            leaveRoom={handleLeave}
            copyInviteLink={copyInviteLink}
            participantCount={participants.length}
            unreadCount={unreadCount}
            autoFrame={autoFrame}
            toggleAutoFrame={() => setAutoFrame((v) => !v)}
          />
        </div>

        {showChat && (
          <div className="w-full sm:w-80 lg:w-96 border-l border-gray-800 bg-gray-900/50 flex flex-col">
            <Chat messages={messages} onSend={sendMessage} onClose={() => setShowChat(false)} />
          </div>
        )}

        <MessagePopup
          messages={popupMessages}
          onDismiss={(id) => setPopupMessages((prev) => prev.filter((m) => m.id !== id))}
        />
      </div>
    </div>
  );
}
