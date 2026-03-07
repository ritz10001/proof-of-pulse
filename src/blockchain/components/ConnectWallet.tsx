"use client";

import { useState } from "react";
import { useWallet } from "../providers/WalletProvider";

interface ConnectWalletProps {
  className?: string;
  connectText?: string;
  disconnectText?: string;
  showAddress?: boolean;
}

export function ConnectWallet({
  className = "",
  connectText = "Connect MetaMask",
  disconnectText = "Disconnect",
  showAddress = true,
}: ConnectWalletProps) {
  const { address, isConnected, isInstalled, connect, disconnect } = useWallet();
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    setError(null);
    setIsConnecting(true);
    try {
      await connect();
    } catch (err: any) {
      console.error("Connect error:", err);
      setError(err.message || "Failed to connect wallet");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
      setError(null);
    } catch (err: any) {
      console.error("Disconnect error:", err);
      setError(err.message || "Failed to disconnect wallet");
    }
  };

  if (!isInstalled) {
    return (
      <div className={className}>
        <a
          href="https://metamask.io"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors"
        >
          Install MetaMask
        </a>
        <p className="text-sm text-gray-600 mt-2">
          MetaMask extension not detected. Please install it to continue.
        </p>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className={className}>
        <button
          onClick={handleConnect}
          disabled={isConnecting}
          className={`px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed`}
        >
          {isConnecting ? "Connecting..." : connectText}
        </button>
        {error && (
          <p className="text-sm text-red-600 mt-2">{error}</p>
        )}
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {showAddress && address && (
        <span className="text-sm text-gray-600">
          {address.slice(0, 6)}...{address.slice(-4)}
        </span>
      )}
      <button
        onClick={handleDisconnect}
        className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
      >
        {disconnectText}
      </button>
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
