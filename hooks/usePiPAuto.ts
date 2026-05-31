"use client";

import { useEffect, useRef } from "react";
import type { Participant, MediaState } from "./useWebRTC";

type PiPOptions = {
  participants: Participant[];
  enabled?: boolean;
  mediaState?: MediaState;
  toggleMic?: () => void;
  toggleCamera?: () => void;
  toggleScreenShare?: (shareAudio?: boolean) => void;
  toggleAutoFrame?: () => void;
  setShowChat?: (v: boolean) => void;
  copyInviteLink?: () => void;
  leaveRoom?: () => void;
};

const CONTROL_SVG = {
  micOn: `<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/></svg>`,
  micOff: `<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"/></svg>`,
  camOn: `<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>`,
  camOff: `<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/></svg>`,
  leave: `<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z"/></svg>`,
};

const CONTROL_STYLE = `
  .pip-btn { width:36px; height:36px; border-radius:50%; border:1.5px solid rgba(255,255,255,0.6); background:rgba(0,0,0,0.5); cursor:pointer; display:flex; align-items:center; justify-content:center; padding:7px; flex-shrink:0; transition:background 0.2s; }
  .pip-btn:hover { background:rgba(255,255,255,0.15); }
  .pip-btn svg { width:100%; height:100%; }
  .pip-btn.off { border-color:rgba(220,38,38,0.7); background:rgba(220,38,38,0.3); }
  .pip-btn.leave { border-color:rgba(220,38,38,0.8); background:rgba(220,38,38,0.5); }
  .pip-btn.leave:hover { background:rgba(220,38,38,0.7); }
  .controls-bar { position:absolute; bottom:0; left:0; right:0; display:flex; align-items:center; justify-content:center; gap:8px; padding:12px 8px; background:linear-gradient(transparent,rgba(0,0,0,0.85)); }
`;

export function usePiPAuto({ participants, enabled = true, mediaState, toggleMic, toggleCamera, toggleScreenShare, toggleAutoFrame, setShowChat, copyInviteLink, leaveRoom }: PiPOptions) {
  const pipWindowRef = useRef<Window | null>(null);
  const participantsRef = useRef(participants);
  const mediaStateRef = useRef(mediaState);
  const toggleMicRef = useRef(toggleMic);
  const toggleCameraRef = useRef(toggleCamera);
  const leaveRoomRef = useRef(leaveRoom);
  participantsRef.current = participants;
  mediaStateRef.current = mediaState;
  toggleMicRef.current = toggleMic;
  toggleCameraRef.current = toggleCamera;
  leaveRoomRef.current = leaveRoom;

  useEffect(() => {
    if (!enabled) return;
    if (!("documentPictureInPicture" in window)) return;

    const handleVisibilityChange = async () => {
      if (document.hidden) {
        if (pipWindowRef.current) return;

        try {
          const pipWindow = await (
            window as unknown as {
              documentPictureInPicture: {
                requestWindow: (opts?: {
                  width?: number;
                  height?: number;
                }) => Promise<Window>;
              };
            }
          ).documentPictureInPicture.requestWindow({
            width: 480,
            height: 400,
          });

          pipWindowRef.current = pipWindow;

          pipWindow.document.head.innerHTML = `<style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { background: #030712; overflow: hidden; font-family: system-ui, sans-serif; }
            .grid { width: 100vw; height: calc(100vh - 60px); display: flex; flex-wrap: wrap; }
            .tile { flex: 1; min-width: ${participants.length <= 1 ? "100" : "50"}%; position: relative; overflow: hidden; display: flex; align-items: center; justify-content: center; background: #111827; }
            .tile video { width: 100%; height: 100%; object-fit: cover; }
            .tile .label { position: absolute; bottom: 4px; left: 4px; padding: 2px 8px; background: rgba(0,0,0,0.7); border-radius: 6px; font: 11px system-ui, sans-serif; color: #d1d5db; pointer-events: none; white-space: nowrap; }
            .avatar { width: 40px; height: 40px; border-radius: 50%; background: #2563eb; display: flex; align-items: center; justify-content: center; color: white; font: bold 14px system-ui, sans-serif; }
          </style>`;

          const grid = pipWindow.document.createElement("div");
          grid.className = "grid";

          const currentParticipants = participantsRef.current;

          for (const p of currentParticipants) {
            const hasVideo = p.stream
              ?.getVideoTracks()
              ?.some((t) => t.enabled);

            const tile = pipWindow.document.createElement("div");
            tile.className = "tile";

            if (hasVideo && p.stream) {
              const video = pipWindow.document.createElement("video");
              video.srcObject = p.stream;
              video.autoplay = true;
              video.playsInline = true;
              video.muted = !!p.isLocal;
              if (p.isLocal) video.style.transform = "scaleX(-1)";
              tile.appendChild(video);
            } else {
              const avatar = pipWindow.document.createElement("div");
              avatar.className = "avatar";
              const initials = p.name
                .split(" ")
                .map((w) => w[0])
                .join("")
                .toUpperCase()
                .slice(0, 2) || "?";
              avatar.textContent = initials;
              tile.appendChild(avatar);
            }

            if (p.name) {
              const label = pipWindow.document.createElement("div");
              label.className = "label";
              label.textContent = p.isLocal ? "You" : p.name;
              tile.appendChild(label);
            }

            grid.appendChild(tile);
          }

          pipWindow.document.body.appendChild(grid);

          const controlsStyle = pipWindow.document.createElement("style");
          controlsStyle.textContent = CONTROL_STYLE;
          pipWindow.document.head.appendChild(controlsStyle);

          const controlsBar = pipWindow.document.createElement("div");
          controlsBar.className = "controls-bar";
          controlsBar.id = "pip-controls";

          const btns: Array<{ id: string; getSvg: () => string; off?: boolean; action: () => void }> = [];

          if (toggleMicRef.current) {
            btns.push({
              id: "pip-mic",
              getSvg: () => mediaStateRef.current?.mic ? CONTROL_SVG.micOn : CONTROL_SVG.micOff,
              off: !mediaStateRef.current?.mic,
              action: () => toggleMicRef.current?.(),
            });
          }
          if (toggleCameraRef.current) {
            btns.push({
              id: "pip-cam",
              getSvg: () => mediaStateRef.current?.camera ? CONTROL_SVG.camOn : CONTROL_SVG.camOff,
              off: !mediaStateRef.current?.camera,
              action: () => toggleCameraRef.current?.(),
            });
          }
          if (leaveRoomRef.current) {
            btns.push({
              id: "pip-leave",
              getSvg: () => CONTROL_SVG.leave,
              action: () => leaveRoomRef.current?.(),
            });
          }

          for (const btn of btns) {
            const el = pipWindow.document.createElement("button");
            el.className = "pip-btn" + (btn.off ? " off" : "");
            el.id = btn.id;
            el.innerHTML = btn.getSvg();
            el.addEventListener("click", btn.action);
            controlsBar.appendChild(el);
          }

          pipWindow.document.body.appendChild(controlsBar);

          pipWindow.addEventListener("pagehide", () => {
            pipWindowRef.current = null;
          });
        } catch {
          console.warn("Failed to enter Picture-in-Picture mode");
        }
      } else {
        if (pipWindowRef.current) {
          pipWindowRef.current.close();
          pipWindowRef.current = null;
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange,
      );
      if (pipWindowRef.current) {
        pipWindowRef.current.close();
        pipWindowRef.current = null;
      }
    };
  }, [enabled, participants.length]);
}
