"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import PixelHeart from "./PixelHeart";
import { useWallet } from "@/blockchain/providers/WalletProvider";

export default function Navbar() {
  const [visible, setVisible] = useState(true);
  const lastScrollY = useRef(0);
  const { address, isConnected, isInstalled, connect } = useWallet();
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    if (!isInstalled) {
      window.open("https://metamask.io", "_blank");
      return;
    }
    setIsConnecting(true);
    try {
      await connect();
    } catch (err) {
      console.error("Failed to connect:", err);
    } finally {
      setIsConnecting(false);
    }
  };

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setVisible(y < 50 || y < lastScrollY.current);
      lastScrollY.current = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 transition-transform duration-300"
      style={{ transform: visible ? "translateY(0)" : "translateY(-100%)" }}
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <PixelHeart size={24} color="#d63555" className="pixel-pulse" />
          <span className="font-mono font-bold text-sm tracking-widest uppercase text-foreground">
            Proof of Pulse
          </span>
          <span className="glass-pink text-[10px] font-mono px-2.5 py-1 text-pink-primary rounded-md cursor-default">
            XRP TESTNET
          </span>
        </div>
        <div className="flex items-center gap-2">
          <a href="#how-it-works" className="glass text-sm font-mono text-foreground/70 hover:text-foreground px-4 py-2 rounded-lg transition-all">
            How It Works
          </a>
          <a href="#stats" className="glass text-sm font-mono text-foreground/70 hover:text-foreground px-4 py-2 rounded-lg transition-all">
            Stats
          </a>
          <Link href="/dao" className="glass-pink text-sm font-mono text-pink-primary hover:text-pink-dark px-4 py-2 rounded-lg transition-all">
            Insurance DAO
          </Link>
          <Link href="/dao/challenges" className="glass text-sm font-mono text-foreground/70 hover:text-foreground px-4 py-2 rounded-lg transition-all">
            Challenges
          </Link>
          <button
            onClick={handleConnect}
            disabled={isConnecting}
            className="glass-pink-solid text-pink-dark text-sm font-mono px-5 py-2 rounded-lg cursor-pointer transition-all disabled:opacity-50"
          >
            {isConnecting ? "Connecting..." : isConnected ? `${address?.slice(0, 6)}...${address?.slice(-4)}` : "Connect Wallet"}
          </button>
        </div>
      </div>
    </nav>
  );
}
