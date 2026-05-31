"use client";

import { useEffect, useRef, useState } from "react";
import type { Message } from "@/hooks/useWebRTC";

type Props = {
  messages: Message[];
  onDismiss: (id: string) => void;
};

export default function MessagePopup({ messages, onDismiss }: Props) {
  const latest = messages[messages.length - 1];
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!latest) return;
    const id = setTimeout(() => setVisible(true), 0);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onDismiss(latest.id), 300);
    }, 4000);
    return () => {
      clearTimeout(id);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latest?.id, onDismiss]);

  if (!latest) return null;

  return (
    <div
      className={`fixed bottom-20 right-4 sm:right-6 z-50 max-w-xs w-full transition-all duration-300 ${
        visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0 pointer-events-none"
      }`}
    >
      <div className="bg-gray-900/90 backdrop-blur-xl border border-gray-800/60 rounded-2xl shadow-2xl shadow-black/30 p-4">
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium text-blue-400 truncate">{latest.senderName}</p>
              <span className="text-[10px] text-gray-500 shrink-0">
                {new Date(latest.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
            <p className="text-sm text-gray-200 mt-1 leading-relaxed break-words line-clamp-2">{latest.message}</p>
          </div>
          <button
            onClick={() => { setVisible(false); setTimeout(() => onDismiss(latest.id), 300); }}
            className="p-0.5 hover:bg-gray-800 rounded shrink-0 text-gray-500 hover:text-white transition-all duration-300 -mt-0.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
