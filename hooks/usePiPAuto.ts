"use client";

import { useEffect, useRef } from "react";
import type { Participant } from "./useWebRTC";

type PiPOptions = {
  participants: Participant[];
  enabled?: boolean;
};

export function usePiPAuto({ participants, enabled = true }: PiPOptions) {
  const pipWindowRef = useRef<Window | null>(null);
  const participantsRef = useRef(participants);
  participantsRef.current = participants;

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
            height: 360,
          });

          pipWindowRef.current = pipWindow;

          pipWindow.document.head.innerHTML = `<style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { background: #030712; overflow: hidden; }
            .grid { width: 100vw; height: 100vh; display: flex; flex-wrap: wrap; }
            .tile { flex: 1; min-width: ${participants.length <= 1 ? "100" : "50"}%; position: relative; overflow: hidden; display: flex; align-items: center; justify-content: center; background: #111827; border-radius: 4px; }
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
