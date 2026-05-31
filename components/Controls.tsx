"use client";

import { useState, useEffect, useRef } from "react";
import type { MediaState } from "@/hooks/useWebRTC";
import BorderGlow from "./BorderGlow";

type Props = {
  mediaState: MediaState;
  toggleCamera: () => void;
  toggleMic: () => void;
  toggleScreenShare: (shareAudio?: boolean) => void;
  showChat: boolean;
  setShowChat: (v: boolean) => void;
  leaveRoom: () => void;
  copyInviteLink: () => void;
  participantCount: number;
  unreadCount?: number;
  autoFrame: boolean;
  toggleAutoFrame: () => void;
  isSpeaking?: boolean;
};

export default function Controls({
  mediaState,
  toggleCamera,
  toggleMic,
  toggleScreenShare,
  showChat,
  setShowChat,
  leaveRoom,
  copyInviteLink,
  unreadCount = 0,
  autoFrame,
  toggleAutoFrame,
  isSpeaking,
}: Props) {
  const [shareAudio, setShareAudio] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showMutedWarning, setShowMutedWarning] = useState(false);
  const mutedWarningTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleCopyLink = () => {
    copyInviteLink();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    if (!mediaState.mic && isSpeaking) {
      setShowMutedWarning(true);
      if (mutedWarningTimer.current) clearTimeout(mutedWarningTimer.current);
      mutedWarningTimer.current = setTimeout(() => setShowMutedWarning(false), 5000);
    }
  }, [mediaState.mic, isSpeaking]);

  return (
    <>
    <div className="px-4 py-3 bg-gray-900/80 backdrop-blur-md border-t border-gray-800/60">
      <div className="max-w-3xl mx-auto flex items-center justify-center gap-2 sm:gap-3">
        <ControlButton active={mediaState.mic} onClick={toggleMic} label={mediaState.mic ? "Mute" : "Unmute"}>
          {mediaState.mic ? (
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          ) : (
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
          )}
        </ControlButton>

        <ControlButton active={mediaState.camera} onClick={toggleCamera} label={mediaState.camera ? "Stop Camera" : "Start Camera"}>
          {mediaState.camera ? (
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          ) : (
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          )}
        </ControlButton>

        <div className="flex flex-col items-center gap-1">
          <ControlButton
            active={mediaState.screen}
            onClick={() => {
              if (mediaState.screen) {
                toggleScreenShare();
              } else {
                setShowShareDialog(true);
              }
            }}
            label={mediaState.screen ? "Stop Share" : "Share Screen"}
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </ControlButton>
        </div>

        <ControlButton active={autoFrame} onClick={toggleAutoFrame} label={autoFrame ? "Disable Auto Frame" : "Enable Auto Frame"}>
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        </ControlButton>

        <div className="relative">
          <ControlButton active={showChat} onClick={() => setShowChat(!showChat)} label="Chat">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </ControlButton>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 shadow-lg shadow-red-500/30">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </div>

        <div className="mx-2 h-8 w-px bg-gray-800/60" />

        <ControlButton active={copied} activeBg="#1a5c2a" onClick={handleCopyLink} label={copied ? "Copied!" : "Copy Link"}>
          {copied ? (
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          )}
        </ControlButton>

        <button
          onClick={leaveRoom}
          className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all duration-300 text-sm font-medium flex items-center gap-2 shadow-lg shadow-red-600/20 hover:shadow-red-500/40"
          title="Leave meeting"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
          </svg>
          Leave
        </button>
      </div>
    </div>

      {showMutedWarning && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
          <div className="bg-gray-900 border border-gray-700/60 rounded-2xl px-5 py-4 shadow-2xl shadow-black/40 flex items-center gap-4 backdrop-blur-xl">
            <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white font-medium">You&apos;re muted. Others can&apos;t hear you.</p>
            </div>
            <button
              onClick={() => { toggleMic(); setShowMutedWarning(false); }}
              className="px-4 py-2 bg-white text-black text-sm font-semibold rounded-xl hover:bg-gray-200 transition-all duration-200 shrink-0"
            >
              Unmute
            </button>
          </div>
        </div>
      )}

    {showShareDialog && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
        <BorderGlow
          edgeSensitivity={30}
          glowColor="40 80 80"
          backgroundColor="#030712"
          borderRadius={24}
          glowRadius={40}
          glowIntensity={1}
          coneSpread={25}
          animated={false}
          colors={["#c084fc", "#f472b6", "#38bdf8"]}
          className="w-full max-w-sm mx-4 animate-slide-up"
        >
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-600/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Share Screen</h3>
                <p className="text-sm text-gray-400">Choose what to share</p>
              </div>
            </div>

            <label className="flex items-start gap-3 p-3 rounded-xl bg-gray-800/80 border border-gray-700/50 cursor-pointer hover:bg-gray-800 transition-all duration-300">
              <input
                type="checkbox"
                checked={shareAudio}
                onChange={(e) => setShareAudio(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded accent-blue-500"
              />
              <div>
                <p className="text-sm font-medium text-white">Also share all audio outputs</p>
                <p className="text-xs text-gray-400 mt-0.5">Share your computer&apos;s audio along with the screen</p>
              </div>
            </label>

            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setShowShareDialog(false)}
                className="flex-1 py-2.5 px-4 bg-gray-800 hover:bg-gray-700/80 border border-gray-700/50 text-white rounded-xl transition-all duration-300 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowShareDialog(false);
                  toggleScreenShare(shareAudio);
                }}
                className="flex-1 py-2.5 px-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-xl transition-all duration-300 text-sm font-medium shadow-lg shadow-blue-600/20"
              >
                Start Sharing
              </button>
            </div>
          </div>
        </BorderGlow>
      </div>
    )}
    </>
  );
}

function ControlButton({
  children,
  onClick,
  label,
  active,
  activeBg,
}: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
  active?: boolean;
  activeBg?: string;
}) {
  return (
    <button
      onClick={onClick}
      className="btn-ctrl"
      title={label}
      style={{ "--ctrl-bg": active ? (activeBg ?? "#444") : "#222" } as React.CSSProperties}
    >
      {children}
    </button>
  );
}
