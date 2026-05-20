"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { Socket } from "socket.io-client";
import { getSocket } from "@/lib/socket";

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
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
    "connecting" | "connected" | "no-media"
  >("connecting");

  const localStream = useRef<MediaStream | null>(null);
  const screenStream = useRef<MediaStream | null>(null);
  const peerConnections = useRef<Record<string, RTCPeerConnection>>({});
  const socket = useRef<Socket | null>(null);

  const sendSignal = useCallback((to: string, signal: unknown) => {
    socket.current?.emit("signal", { to, signal });
  }, []);

  async function createPeerConnection(targetId: string, stream: MediaStream | null) {
    const pc = new RTCPeerConnection(ICE_SERVERS);

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        sendSignal(targetId, {
          type: "ice-candidate",
          candidate: e.candidate,
        });
      }
    };

    pc.ontrack = (e) => {
      setParticipants((prev) => {
        const existing = prev.find((p) => p.id === targetId);
        if (existing) {
          return prev.map((p) =>
            p.id === targetId ? { ...p, stream: e.streams[0] } : p,
          );
        }
        return prev.map((p) =>
          p.id === targetId ? { ...p, stream: e.streams[0] } : p,
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

    async function init() {
      const stream = await startLocalMedia();

      s.emit("join-room", { roomId, name: userName });

      if (!stream) {
        setConnectionStatus("no-media");
        return;
      }

      setConnectionStatus("connected");

      s.on("room-users", async ({ participants: existingUsers }: { participants: Array<{ id: string; name: string }> }) => {
        if (!stream) return;
        for (const user of existingUsers) {
          setParticipants((prev) => [
            ...prev,
            { id: user.id, name: user.name, stream: null },
          ]);
          const pc = await createPeerConnection(user.id, stream);
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          sendSignal(user.id, { type: "offer", sdp: pc.localDescription });
        }
      });

      s.on("user-joined", async ({ id, name }: { id: string; name: string }) => {
        if (!stream) return;
        setParticipants((prev) => [...prev, { id, name, stream: null }]);
        const pc = await createPeerConnection(id, stream);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        sendSignal(id, { type: "offer", sdp: pc.localDescription });
      });

      s.on("user-left", ({ id }: { id: string }) => {
        if (peerConnections.current[id]) {
          peerConnections.current[id].close();
          delete peerConnections.current[id];
        }
        setParticipants((prev) => prev.filter((p) => p.id !== id));
      });

      s.on("signal", async ({ from, signal }: { from: string; signal: any }) => {
        if (signal.type === "offer") {
          const pc = await createPeerConnection(from, stream);
          await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          sendSignal(from, { type: "answer", sdp: pc.localDescription });
        } else if (signal.type === "answer") {
          const pc = peerConnections.current[from];
          if (pc) {
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
        setMessages((prev) => [...prev, data]);
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
        setParticipants((prev) =>
          prev.map((p) => (p.id === id ? { ...p, sharingScreen: true } : p)),
        );
      });

      s.on("participant-screen-share-stopped", ({ id }: { id: string }) => {
        setParticipants((prev) =>
          prev.map((p) => (p.id === id ? { ...p, sharingScreen: false } : p)),
        );
      });
    }

    init();

    return () => {
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
      setParticipants((prev) => [
        {
          id: "local",
          name: userName || "You",
          stream,
          isLocal: true,
          cameraEnabled: true,
          micEnabled: true,
        },
        ...prev,
      ]);
    },
    [userName],
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

  const toggleScreenShareRef = useRef<() => void>(() => {});

  const toggleScreenShare = useCallback(async () => {
    if (mediaState.screen) {
      if (screenStream.current) {
        screenStream.current.getTracks().forEach((t) => t.stop());
      }
      screenStream.current = null;
      setMediaState((prev) => ({ ...prev, screen: false }));
      socket.current?.emit("screen-share-stopped", { roomId });

      const videoTrack = localStream.current?.getVideoTracks()[0];
      if (videoTrack) {
        for (const pc of Object.values(peerConnections.current)) {
          const sender = pc.getSenders().find((s) => s.track?.kind === "video");
          if (sender) await sender.replaceTrack(videoTrack);
        }
      }
    } else {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false,
        });
        screenStream.current = stream;
        setMediaState((prev) => ({ ...prev, screen: true }));
        socket.current?.emit("screen-share-started", { roomId });

        const screenTrack = stream.getVideoTracks()[0];
        for (const pc of Object.values(peerConnections.current)) {
          const sender = pc.getSenders().find((s) => s.track?.kind === "video");
          if (sender) await sender.replaceTrack(screenTrack);
        }

        screenTrack.onended = () => {
          toggleScreenShareRef.current();
        };
      } catch {
        // user cancelled
      }
    }
  }, [mediaState.screen, roomId]);

  toggleScreenShareRef.current = toggleScreenShare;

  const sendMessage = useCallback(
    (text: string) => {
      if (!text.trim()) return;
      socket.current?.emit("send-message", { roomId, message: text });
      setMessages((prev) => [
        ...prev,
        {
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
