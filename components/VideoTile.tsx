"use client";

import { useCallback, useRef, useEffect } from "react";
import type { Participant } from "@/hooks/useWebRTC";
import type { FaceDetector } from "@mediapipe/tasks-vision";

type Props = {
  participant: Participant;
  isLocal?: boolean;
  localStream?: MediaStream | null;
  enableAutoFrame?: boolean;
};

export default function VideoTile({ participant, isLocal, localStream, enableAutoFrame }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const detectorRef = useRef<FaceDetector | null>(null);
  const rafRef = useRef<number>(0);

  const setVideoRef = useCallback((node: HTMLVideoElement | null) => {
    videoRef.current = node;
    if (!node) return;
    const stream = isLocal ? localStream : participant.stream;
    if (stream) {
      node.srcObject = stream;
    }
  }, [isLocal, localStream, participant.stream]);

  useEffect(() => {
    if (!isLocal || !enableAutoFrame) return;

    const origError = console.error;
    console.error = (...args: Parameters<typeof console.error>) => {
      if (typeof args[0] === "string" && args[0].includes("TensorFlow Lite XNNPACK")) return;
      origError.apply(console, args);
    };

    let cancelled = false;

    const init = async () => {
      const { FaceDetector, FilesetResolver } = await import("@mediapipe/tasks-vision");

      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm"
      );

      if (cancelled) return;

      detectorRef.current = await FaceDetector.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite",
        },
        runningMode: "VIDEO",
      });

      if (!cancelled) loop();
    };

    const loop = () => {
      const video = videoRef.current;
      if (!video || !detectorRef.current) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      const results = detectorRef.current.detectForVideo(video, performance.now());

      if (results.detections.length > 0) {
        const face = results.detections[0];
        const box = face.boundingBox;
        if (!box) return;
        const scale = video.clientWidth / video.videoWidth;
        let centerX = (box.originX + box.width / 2) * scale;
        if (isLocal) centerX = video.clientWidth - centerX;
        const containerWidth = video.parentElement?.clientWidth ?? window.innerWidth;
        const offset = containerWidth / 2 - centerX;
        video.style.transform = `translateX(${offset}px)`;
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    init();

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafRef.current);
      detectorRef.current?.close();
      console.error = origError;
    };
  }, [isLocal, enableAutoFrame]);

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
            ref={setVideoRef}
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
