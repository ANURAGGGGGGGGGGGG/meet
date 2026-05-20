"use client";

import type { MediaState } from "@/hooks/useWebRTC";

type Props = {
  mediaState: MediaState;
  toggleCamera: () => void;
  toggleMic: () => void;
  toggleScreenShare: () => void;
  showChat: boolean;
  setShowChat: (v: boolean) => void;
  leaveRoom: () => void;
  copyInviteLink: () => void;
  participantCount: number;
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
}: Props) {
  return (
    <div className="px-4 py-3 bg-gray-900/80 backdrop-blur-md border-t border-gray-800">
      <div className="max-w-3xl mx-auto flex items-center justify-center gap-2 sm:gap-3">
        <ControlButton
          active={mediaState.mic}
          onClick={toggleMic}
          label={mediaState.mic ? "Mute" : "Unmute"}
          activeColor="bg-gray-700 hover:bg-gray-600"
          inactiveColor="bg-red-600 hover:bg-red-700"
        >
          {mediaState.mic ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
          )}
        </ControlButton>

        <ControlButton
          active={mediaState.camera}
          onClick={toggleCamera}
          label={mediaState.camera ? "Stop Camera" : "Start Camera"}
          activeColor="bg-gray-700 hover:bg-gray-600"
          inactiveColor="bg-red-600 hover:bg-red-700"
        >
          {mediaState.camera ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          )}
        </ControlButton>

        <ControlButton
          active={mediaState.screen}
          onClick={toggleScreenShare}
          label={mediaState.screen ? "Stop Share" : "Share Screen"}
          activeColor="bg-gray-700 hover:bg-gray-600"
          inactiveColor="bg-gray-700 hover:bg-gray-600"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </ControlButton>

        <ControlButton
          active={showChat}
          onClick={() => setShowChat(!showChat)}
          label="Chat"
          activeColor="bg-blue-600 hover:bg-blue-700"
          inactiveColor="bg-gray-700 hover:bg-gray-600"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </ControlButton>

        <div className="mx-2 h-8 w-px bg-gray-800" />

        <ControlButton
          active={false}
          onClick={copyInviteLink}
          label="Copy Link"
          activeColor="bg-gray-700 hover:bg-gray-600"
          inactiveColor="bg-gray-700 hover:bg-gray-600"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        </ControlButton>

        <button
          onClick={leaveRoom}
          className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl transition text-sm font-medium flex items-center gap-2"
          title="Leave meeting"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
          </svg>
          Leave
        </button>
      </div>
    </div>
  );
}

function ControlButton({
  children,
  active,
  onClick,
  label,
  activeColor,
  inactiveColor,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
  label: string;
  activeColor: string;
  inactiveColor: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`p-2.5 rounded-xl transition text-white ${active ? activeColor : inactiveColor}`}
      title={label}
    >
      {children}
    </button>
  );
}
