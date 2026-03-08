"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface HRData {
  bpm: number;
  min: number;
  max: number;
  date: string;
  source: string;
  totalSamples: number;
}

interface AppleWatchModalProps {
  isOpen: boolean;
  onClose: (data: HRData | null) => void;
}

export default function AppleWatchModal({ isOpen, onClose }: AppleWatchModalProps) {
  const [status, setStatus] = useState<"loading" | "success">("loading");
  const [hrData, setHrData] = useState<HRData | null>(null);
  const [dots, setDots] = useState("");
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  // Animated dots
  useEffect(() => {
    if (!isOpen || status !== "loading") return;
    const id = setInterval(() => {
      setDots((d) => (d.length >= 3 ? "" : d + "."));
    }, 500);
    return () => clearInterval(id);
  }, [isOpen, status]);

  // Poll for HR data
  const startPolling = useCallback(() => {
    startTimeRef.current = Date.now();
    setStatus("loading");
    setHrData(null);

    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch("/api/heartbeat");
        const data = await res.json();

        // Only accept data that arrived after we started polling
        if (data.success && data.receivedAt > startTimeRef.current) {
          setHrData(data);
          setStatus("success");
          if (pollRef.current) clearInterval(pollRef.current);
        }
      } catch {
        // keep polling
      }
    }, 2000);
  }, []);

  useEffect(() => {
    if (isOpen) {
      startPolling();
    } else {
      if (pollRef.current) clearInterval(pollRef.current);
      setStatus("loading");
      setHrData(null);
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [isOpen, startPolling]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <style>{`
        @keyframes watchFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
      `}</style>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative flex flex-col items-center gap-8">
        {/* Apple Watch body */}
        <div className="relative" style={{ animation: "watchFloat 3s ease-in-out infinite" }}>
          {/* Watch case — rounded rectangle with "metal" border */}
          <div
            className="relative w-[200px] h-[240px] rounded-[40px] bg-gradient-to-b from-[#2c2c2e] to-[#1c1c1e] shadow-2xl"
            style={{
              boxShadow:
                "0 0 0 3px #3a3a3c, 0 0 0 5px #1c1c1e, 0 20px 60px rgba(0,0,0,0.5)",
            }}
          >
            {/* Crown button */}
            <div className="absolute -right-[6px] top-[60px] w-[6px] h-[28px] rounded-r-full bg-gradient-to-b from-[#4a4a4c] to-[#3a3a3c]" />
            <div className="absolute -right-[5px] top-[100px] w-[5px] h-[16px] rounded-r-full bg-gradient-to-b from-[#4a4a4c] to-[#3a3a3c]" />

            {/* Screen */}
            <div className="absolute inset-[12px] rounded-[30px] bg-black overflow-hidden flex flex-col items-center justify-center">
              {status === "loading" ? (
                <LoadingScreen dots={dots} />
              ) : (
                <SuccessScreen hrData={hrData!} />
              )}
            </div>
          </div>

          {/* Watch band top */}
          <div className="absolute -top-[40px] left-1/2 -translate-x-1/2 w-[100px] h-[44px] rounded-t-[12px] bg-gradient-to-b from-[#3a3a3c] to-[#2c2c2e]" />
          {/* Watch band bottom */}
          <div className="absolute -bottom-[40px] left-1/2 -translate-x-1/2 w-[100px] h-[44px] rounded-b-[12px] bg-gradient-to-t from-[#3a3a3c] to-[#2c2c2e]" />
        </div>

        {/* Status text below watch */}
        <div className="mt-8 text-center">
          {status === "loading" ? (
            <p className="font-mono text-sm text-white/60">
              Waiting for Apple Watch data{dots}
            </p>
          ) : (
            <button
              onClick={() => onClose(hrData)}
              className="glass-pink-solid px-10 py-3 text-pink-dark font-mono font-bold text-sm tracking-wider uppercase rounded-lg cursor-pointer transition-all hover:scale-105"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function LoadingScreen({ dots }: { dots: string }) {
  return (
    <>
      {/* Pulsing heart */}
      <div className="mb-3">
        <svg
          width="40"
          height="40"
          viewBox="0 0 24 24"
          fill="#d63555"
          className="animate-pulse"
        >
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
      </div>

      {/* Scanning text */}
      <p className="font-mono text-[11px] text-white/50 tracking-wider">
        SYNCING{dots}
      </p>

      {/* Animated ring */}
      <div className="mt-4 w-[60px] h-[60px] relative">
        <svg viewBox="0 0 60 60" className="animate-spin" style={{ animationDuration: "2s" }}>
          <circle
            cx="30"
            cy="30"
            r="26"
            fill="none"
            stroke="#d63555"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="120"
            strokeDashoffset="40"
            opacity="0.6"
          />
        </svg>
      </div>
    </>
  );
}

function SuccessScreen({ hrData }: { hrData: HRData }) {
  return (
    <>
      {/* Checkmark */}
      <div className="mb-2">
        <svg width="48" height="48" viewBox="0 0 48 48">
          <circle cx="24" cy="24" r="22" fill="none" stroke="#34c759" strokeWidth="3" />
          <path
            d="M14 24l7 7 13-13"
            fill="none"
            stroke="#34c759"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* BPM */}
      <div className="flex items-baseline gap-1">
        <span className="font-mono text-3xl font-black text-white">{hrData.bpm}</span>
        <span className="font-mono text-xs text-white/40">BPM</span>
      </div>

      {/* Range */}
      <p className="font-mono text-[10px] text-white/30 mt-1">
        {hrData.min}–{hrData.max} range
      </p>

      {/* Samples */}
      <p className="font-mono text-[10px] text-[#34c759]/70 mt-2">
        {hrData.totalSamples} samples received
      </p>
    </>
  );
}
