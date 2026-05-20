"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import useWebRTC from "@/hooks/useWebRTC";
import VideoTile from "@/components/VideoTile";
import Controls from "@/components/Controls";
import Chat from "@/components/Chat";
import { disconnectSocket } from "@/lib/socket";

export default function Room() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const roomId = params.roomId as string;
  const userName = searchParams.get("name") || "Anonymous";
  const [showChat, setShowChat] = useState(false);
  const [connectionError, setConnectionError] = useState(false);

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
  } = useWebRTC(roomId, userName);

  const hasAddedLocal = useRef(false);

  useEffect(() => {
    if (localStream.current && !hasAddedLocal.current) {
      hasAddedLocal.current = true;
      addLocalParticipant(localStream.current);
    }
  }, [localStream.current, addLocalParticipant]);

  useEffect(() => {
    if (connectionStatus === "no-media") {
      setConnectionError(true);
    }
  }, [connectionStatus]);

  const handleLeave = useCallback(() => {
    leaveRoom();
    disconnectSocket();
    router.push("/");
  }, [leaveRoom, router]);

  const copyInviteLink = useCallback(() => {
    const link = `${window.location.origin}/room/${roomId}`;
    navigator.clipboard.writeText(link);
  }, [roomId]);

  if (connectionError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 p-4">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-yellow-900/50 border border-yellow-800 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Could not access media devices</h2>
          <p className="text-gray-400 mb-6 text-sm">Please allow camera and microphone access in your browser settings.</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => { setConnectionError(false); hasAddedLocal.current = false; window.location.reload(); }}
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
                <VideoTile key={p.id} participant={p} isLocal={p.isLocal} localStream={p.isLocal ? localStream.current : null} />
              ))}
            </div>
          </div>

          <Controls
            mediaState={mediaState}
            toggleCamera={toggleCamera}
            toggleMic={toggleMic}
            toggleScreenShare={toggleScreenShare}
            showChat={showChat}
            setShowChat={setShowChat}
            leaveRoom={handleLeave}
            copyInviteLink={copyInviteLink}
            participantCount={participants.length}
          />
        </div>

        {showChat && (
          <div className="w-full sm:w-80 lg:w-96 border-l border-gray-800 bg-gray-900/50 flex flex-col">
            <Chat messages={messages} onSend={sendMessage} onClose={() => setShowChat(false)} />
          </div>
        )}
      </div>
    </div>
  );
}
