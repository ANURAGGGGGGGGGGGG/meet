"use client";

import { useCallback } from "react";
import type { Participant } from "@/hooks/useWebRTC";

type Props = {
  participant: Participant;
  isLocal?: boolean;
  localStream?: MediaStream | null;
};

export default function VideoTile({ participant, isLocal, localStream }: Props) {
  const videoRef = useCallback((node: HTMLVideoElement | null) => {
    if (!node) return;
    const stream = isLocal ? localStream : participant.stream;
    if (stream) {
      node.srcObject = stream;
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
    <div className="relative bg-gray-900 rounded-2xl overflow-hidden flex items-center justify-center min-h-[200px] sm:min-h-[240px] border border-gray-800 group">
      {showAvatar ? (
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-xl font-bold text-white">
            {initials}
          </div>
          <span className="text-gray-400 text-sm">{participant.name}</span>
        </div>
      ) : (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={isLocal}
            className={`w-full h-full object-cover ${isLocal ? "scale-x-[-1]" : ""}`}
          />
          <div className="absolute bottom-3 left-3 flex items-center gap-2">
            <span className="px-2.5 py-1 bg-black/70 backdrop-blur-sm rounded-lg text-xs text-gray-300">
              {participant.name}
            </span>
            {!hasAudio && (
              <span className="p-1.5 bg-black/70 backdrop-blur-sm rounded-lg">
                <svg className="w-3.5 h-3.5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
              </span>
            )}
          </div>
        </>
      )}

      {isLocal && (
        <div className="absolute top-3 left-3 px-2 py-1 bg-black/70 backdrop-blur-sm rounded-lg text-xs text-gray-400">
          You
        </div>
      )}

      {participant.sharingScreen && (
        <div className="absolute top-3 right-3 px-2 py-1 bg-green-600/90 backdrop-blur-sm rounded-lg text-xs text-white flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          Screen
        </div>
      )}
    </div>
  );
}
