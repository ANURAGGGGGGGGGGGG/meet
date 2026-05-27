"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { Socket } from "socket.io-client";
import { getSocket } from "@/lib/socket";
import { v4 as uuidv4 } from "uuid";

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    {
      urls: [
        "turn:openrelay.metered.ca:80",
        "turn:openrelay.metered.ca:443",
        "turn:openrelay.metered.ca:443?transport=tcp",
      ],
      username: "openrelayproject",
      credential: "openrelayproject",
    },
  ],
};

export type Participant = {
  id: string;
  name: string;
  stream: MediaStream | null;
  isLocal?: boolean;
  cameraEnabled?: boolean;
  micEnabled?: boolean;
  sharingScreen?: boolean;
};

export type Message = {
  id: string;
  senderId: string;
  senderName: string;
  message: string;
  timestamp: number;
};

export type MediaState = {
  camera: boolean;
  mic: boolean;
  screen: boolean;
};

export default function useWebRTC(roomId: string, userName: string) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [mediaState, setMediaState] = useState<MediaState>({
    camera: false,
    mic: false,
    screen: false,
  });
  const [connectionStatus, setConnectionStatus] = useState<
    "connecting" | "connected" | "no-media" | "error"
  >("connecting");

  const localStream = useRef<MediaStream | null>(null);
  const screenStream = useRef<MediaStream | null>(null);
  const screenSenders = useRef<Map<string, RTCRtpSender>>(new Map());
  const peerConnections = useRef<Record<string, RTCPeerConnection>>({});
  const socket = useRef<Socket | null>(null);
  const listenersAttached = useRef(false);

  const addParticipant = useCallback((p: Participant) => {
    setParticipants((prev) => {
      if (prev.some((x) => x.id === p.id)) return prev;
      return [...prev, p];
    });
  }, []);

  const sendSignal = useCallback((to: string, signal: unknown) => {
    socket.current?.emit("signal", { to, signal });
  }, []);

  async function getOrCreatePeerConnection(targetId: string, stream: MediaStream | null) {
    const existing = peerConnections.current[targetId];
    if (existing && existing.connectionState !== "closed") {
      return existing;
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        console.log("ICE candidate:", e.candidate.candidate);
        sendSignal(targetId, {
          type: "ice-candidate",
          candidate: e.candidate,
        });
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log(`ICE state [${targetId}]:`, pc.iceConnectionState);
    };

    pc.onconnectionstatechange = () => {
      console.log(`Connection state [${targetId}]:`, pc.connectionState);
    };

    pc.ontrack = (e) => {
      console.log(`Track received [${targetId}]:`, e.track.kind);
      setParticipants((prev) => {
        const existing = prev.find((p) => p.id === targetId);
        const incoming = e.streams[0];
        if (existing && existing.stream && existing.stream.id !== incoming.id) {
          const screenId = `screen-${targetId}`;
          const existingScreen = prev.find((p) => p.id === screenId);
          if (existingScreen) {
            return prev.map((p) =>
              p.id === screenId ? { ...p, stream: incoming } : p,
            );
          }
          return [
            ...prev,
            {
              id: screenId,
              name: "Screen",
              stream: incoming,
              sharingScreen: true,
            },
          ];
        }
        return prev.map((p) =>
          p.id === targetId ? { ...p, stream: incoming } : p,
        );
      });
    };

    if (stream) {
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });
    }

    peerConnections.current[targetId] = pc;
    return pc;
  }

  async function startLocalMedia() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      localStream.current = stream;
      setMediaState({ camera: true, mic: true, screen: false });
      return stream;
    } catch {
      setConnectionStatus("no-media");
      return null;
    }
  }

  useEffect(() => {
    const s = getSocket();
    socket.current = s;

    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    async function init() {
      if (listenersAttached.current) return;
      if (!roomId) return;
      listenersAttached.current = true;

      // Register all event listeners BEFORE emitting join-room
      // so we never miss events like room-users
      s.on("room-users", ({ participants: existingUsers }: { participants: Array<{ id: string; name: string }> }) => {
        for (const user of existingUsers) {
          addParticipant({ id: user.id, name: user.name, stream: null });
        }
      });

      s.on("user-joined", async ({ id, name }: { id: string; name: string }) => {
        addParticipant({ id, name, stream: null });
        // Skip if a PC already exists for this peer (signal handler may have
        // created one first, avoiding a race between the two async handlers)
        if (peerConnections.current[id]) return;
        const stream = localStream.current;
        if (!stream) return;
        const pc = await getOrCreatePeerConnection(id, stream);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        sendSignal(id, { type: "offer", sdp: pc.localDescription });
      });

      s.on("user-left", ({ id }: { id: string }) => {
        if (peerConnections.current[id]) {
          peerConnections.current[id].close();
          delete peerConnections.current[id];
        }
        setParticipants((prev) =>
          prev.filter((p) => p.id !== id && p.id !== `screen-${id}`),
        );
      });

      s.on("signal", async ({ from, signal }: { from: string; signal: any }) => {
        const stream = localStream.current;
        if (!stream) return;

        if (signal.type === "offer") {
          // Ensure the participant exists in state even if room-users was missed
          setParticipants((prev) => {
            if (prev.some((p) => p.id === from)) return prev;
            return [...prev, { id: from, name: from, stream: null }];
          });

          const pc = await getOrCreatePeerConnection(from, stream);
          // Only proceed if we're in the right state for receiving an offer
          if (pc.signalingState !== "stable" && pc.signalingState !== "have-local-offer") return;
          if (pc.signalingState === "have-local-offer") {
            await pc.setLocalDescription({ type: "rollback" } as RTCSessionDescriptionInit);
          }
          await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          sendSignal(from, { type: "answer", sdp: pc.localDescription });
        } else if (signal.type === "answer") {
          const pc = peerConnections.current[from];
          if (pc && pc.signalingState === "have-local-offer") {
            await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
          }
        } else if (signal.type === "ice-candidate") {
          const pc = peerConnections.current[from];
          if (pc && signal.candidate) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
            } catch {
              // ignore
            }
          }
        }
      });

      s.on("receive-message", (data: Message) => {
        setMessages((prev) => {
          if (prev.some((m) => m.id === data.id)) return prev;
          return [...prev, data];
        });
      });

      s.on("participant-camera-toggled", ({ id, enabled }: { id: string; enabled: boolean }) => {
        setParticipants((prev) =>
          prev.map((p) => (p.id === id ? { ...p, cameraEnabled: enabled } : p)),
        );
      });

      s.on("participant-mic-toggled", ({ id, enabled }: { id: string; enabled: boolean }) => {
        setParticipants((prev) =>
          prev.map((p) => (p.id === id ? { ...p, micEnabled: enabled } : p)),
        );
      });

      s.on("participant-screen-share-started", ({ id }: { id: string }) => {
        setParticipants((prev) => {
          const screenId = `screen-${id}`;
          if (prev.some((p) => p.id === screenId)) {
            return prev.map((p) =>
              p.id === id ? { ...p, sharingScreen: true } : p,
            );
          }
          return [
            ...prev.map((p) =>
              p.id === id ? { ...p, sharingScreen: true } : p,
            ),
            { id: screenId, name: "Screen", stream: null, sharingScreen: true },
          ];
        });
      });

      s.on("participant-screen-share-stopped", ({ id }: { id: string }) => {
        setParticipants((prev) =>
          prev
            .filter((p) => p.id !== `screen-${id}`)
            .map((p) =>
              p.id === id ? { ...p, sharingScreen: false } : p,
            ),
        );
      });

      // Handle socket connection errors
      s.on("connect_error", () => {
        setConnectionStatus("error");
      });

      // Timeout: if still connecting after 15s, show error
      timeoutId = setTimeout(() => {
        setConnectionStatus((prev) => (prev === "connecting" ? "error" : prev));
      }, 15000);

      // Now request media and join the room
      const stream = await startLocalMedia();
      s.emit("join-room", { roomId, name: userName });

      if (!stream) {
        setConnectionStatus("no-media");
        return;
      }

      setConnectionStatus("connected");
    }

    init();

    return () => {
      clearTimeout(timeoutId);
      s.off("connect_error");
      listenersAttached.current = false;
      s.off("room-users");
      s.off("user-joined");
      s.off("user-left");
      s.off("signal");
      s.off("receive-message");
      s.off("participant-camera-toggled");
      s.off("participant-mic-toggled");
      s.off("participant-screen-share-started");
      s.off("participant-screen-share-stopped");

      Object.values(peerConnections.current).forEach((pc) => pc.close());
      peerConnections.current = {};

      if (localStream.current) {
        localStream.current.getTracks().forEach((t) => t.stop());
      }
      if (screenStream.current) {
        screenStream.current.getTracks().forEach((t) => t.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, userName]);

  const addLocalParticipant = useCallback(
    (stream: MediaStream) => {
      addParticipant({
        id: "local",
        name: userName || "You",
        stream,
        isLocal: true,
        cameraEnabled: true,
        micEnabled: true,
      });
    },
    [userName, addParticipant],
  );

  const toggleCamera = useCallback(() => {
    if (!localStream.current) return;
    const enabled = !mediaState.camera;
    localStream.current.getVideoTracks().forEach((t) => (t.enabled = enabled));
    setMediaState((prev) => ({ ...prev, camera: enabled }));
    socket.current?.emit("toggle-camera", { roomId, enabled });
  }, [mediaState.camera, roomId]);

  const toggleMic = useCallback(() => {
    if (!localStream.current) return;
    const enabled = !mediaState.mic;
    localStream.current.getAudioTracks().forEach((t) => (t.enabled = enabled));
    setMediaState((prev) => ({ ...prev, mic: enabled }));
    socket.current?.emit("toggle-mic", { roomId, enabled });
  }, [mediaState.mic, roomId]);

  const toggleScreenShareRef = useRef<(shareAudio?: boolean) => void>(() => {});

  const toggleScreenShare = useCallback(async (shareAudio?: boolean) => {
    if (mediaState.screen) {
      for (const [peerId, sender] of screenSenders.current) {
        const pc = peerConnections.current[peerId];
        if (pc) {
          pc.removeTrack(sender);
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          sendSignal(peerId, { type: "offer", sdp: pc.localDescription });
        }
      }
      screenSenders.current.clear();

      if (screenStream.current) {
        screenStream.current.getTracks().forEach((t) => t.stop());
      }
      screenStream.current = null;
      setMediaState((prev) => ({ ...prev, screen: false }));
      socket.current?.emit("screen-share-stopped", { roomId });

      setParticipants((prev) => prev.filter((p) => p.id !== "local-screen"));
    } else {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: shareAudio || false,
        });
        screenStream.current = stream;
        setMediaState((prev) => ({ ...prev, screen: true }));
        socket.current?.emit("screen-share-started", { roomId });

        const screenTrack = stream.getVideoTracks()[0];
        const screenMs = new MediaStream([screenTrack]);

        for (const [peerId, pc] of Object.entries(peerConnections.current)) {
          const sender = pc.addTrack(screenTrack, screenMs);
          screenSenders.current.set(peerId, sender);
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          sendSignal(peerId, { type: "offer", sdp: pc.localDescription });
        }

        setParticipants((prev) => {
          if (prev.some((p) => p.id === "local-screen")) return prev;
          return [
            ...prev,
            {
              id: "local-screen",
              name: "Your Screen",
              stream,
              isLocal: true,
              sharingScreen: true,
            },
          ];
        });

        if (shareAudio) {
          const screenAudio = stream.getAudioTracks()[0];
          if (screenAudio) {
            for (const pc of Object.values(peerConnections.current)) {
              const sender = pc.getSenders().find((s) => s.track?.kind === "audio");
              if (sender) await sender.replaceTrack(screenAudio);
            }
          }
        }

        screenTrack.onended = () => {
          toggleScreenShareRef.current();
        };
      } catch {
        // user cancelled
      }
    }
  }, [mediaState.screen, roomId, sendSignal]);

  toggleScreenShareRef.current = toggleScreenShare;

  const sendMessage = useCallback(
    (text: string) => {
      if (!text.trim()) return;
      const id = uuidv4();
      socket.current?.emit("send-message", { roomId, message: text, id });
      setMessages((prev) => [
        ...prev,
        {
          id,
          senderId: "local",
          senderName: "You",
          message: text,
          timestamp: Date.now(),
        },
      ]);
    },
    [roomId],
  );

  const leaveRoom = useCallback(() => {
    Object.values(peerConnections.current).forEach((pc) => pc.close());
    peerConnections.current = {};
    if (localStream.current) {
      localStream.current.getTracks().forEach((t) => t.stop());
    }
    if (screenStream.current) {
      screenStream.current.getTracks().forEach((t) => t.stop());
    }
    socket.current?.disconnect();
  }, []);

  return {
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
  };
}
