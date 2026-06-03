"use client";

import { useCallback, useRef } from "react";
import type { Participant } from "@/hooks/useWebRTC";

type Props = {
  participant: Participant;
  isLocal?: boolean;
  localStream?: MediaStream | null;
  selected?: boolean;
  onClick?: () => void;
};

export default function VideoTile({ participant, isLocal, localStream, selected, onClick }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const setVideoRef = useCallback((node: HTMLVideoElement | null) => {
    videoRef.current = node;
    if (!node) return;
    const stream = isLocal ? localStream : participant.stream;
    if (stream) {
      node.srcObject = stream;
    }
    if (isLocal) {
      node.style.transform = "scaleX(-1)";
    }
  }, [isLocal, localStream, participant.stream]);

  const initials = participant.name
    ? participant.name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2) || "?"
    : "?";

  const hasVideo = isLocal
    ? localStream?.getVideoTracks()?.some((t) => t.enabled)
    : participant.stream?.getVideoTracks()?.some((t) => t.enabled);

  const hasAudio = isLocal
    ? localStream?.getAudioTracks()?.some((t) => t.enabled)
    : participant.stream?.getAudioTracks()?.some((t) => t.enabled);

  const showAvatar = !hasVideo;

  return (
    <div
      onClick={onClick}
      className={
        selected
          ? "absolute inset-0 bg-gray-950 flex items-center justify-center"
          : "relative bg-gray-900 rounded-2xl overflow-hidden flex items-center justify-center min-h-[200px] sm:min-h-[240px] border border-gray-800/50 group transition-all duration-500 hover:border-gray-700/80 hover:shadow-lg hover:shadow-black/20 cursor-pointer"
      }
    >
      {showAvatar ? (
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg shadow-blue-500/20 flex items-center justify-center text-xl font-bold text-white">
            {initials}
          </div>
          <span className="text-gray-400 text-sm">{participant.name}</span>
        </div>
      ) : (
        <>
          <video
            ref={setVideoRef}
            autoPlay
            playsInline
            muted={isLocal}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute bottom-3 left-3 flex items-center gap-2">
            <span className="px-2.5 py-1 bg-black/60 backdrop-blur-md rounded-lg text-xs text-gray-200 border border-white/5">
              {participant.name}
            </span>
            {!hasAudio && (
              <span className="p-1.5 bg-black/60 backdrop-blur-md rounded-lg border border-white/5">
                <svg className="w-3.5 h-3.5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
              </span>
            )}
          </div>
        </>
      )}

      {isLocal && (
        <div className="absolute top-3 left-3 px-2.5 py-1 bg-gradient-to-r from-blue-600/80 to-purple-600/80 backdrop-blur-md rounded-lg text-xs text-white font-medium border border-white/5 shadow-lg shadow-blue-600/10">
          You
        </div>
      )}

      {participant.sharingScreen && (
        <div className="absolute top-3 right-3 px-2.5 py-1 bg-gradient-to-r from-green-600/90 to-emerald-600/90 backdrop-blur-md rounded-lg text-xs text-white flex items-center gap-1.5 border border-white/5 shadow-lg shadow-green-600/10">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          Screen
        </div>
      )}

      {selected && (
        <button
          onClick={(e) => { e.stopPropagation(); onClick?.(); }}
          className="absolute top-4 right-4 z-50 w-10 h-10 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-black/80 transition-all duration-200"
          title="Minimize"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
