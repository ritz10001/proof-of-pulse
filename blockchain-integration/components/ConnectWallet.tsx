"use client";

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
      </div>
    );
  }

  if (!isConnected) {
    return (
      <button
        onClick={connect}
        className={`px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors ${className}`}
      >
        {connectText}
      </button>
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
        onClick={disconnect}
        className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
      >
        {disconnectText}
      </button>
    </div>
  );
}
