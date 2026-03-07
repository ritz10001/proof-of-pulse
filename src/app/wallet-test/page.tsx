"use client";

import { useEffect, useState } from "react";
import { ConnectWallet } from "@/blockchain/components/ConnectWallet";
import { useWallet } from "@/blockchain/providers/WalletProvider";

export default function WalletTestPage() {
  const { address, isConnected, isInstalled, chainId } = useWallet();
  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    const checkEnvironment = () => {
      const info: any = {
        hasWindow: typeof window !== "undefined",
        hasEthereum: typeof window !== "undefined" && !!window.ethereum,
        ethereumType: typeof window !== "undefined" && window.ethereum ? typeof window.ethereum : "N/A",
        isMetaMask: typeof window !== "undefined" && window.ethereum?.isMetaMask,
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "N/A",
      };

      if (typeof window !== "undefined" && window.ethereum) {
        info.ethereumProviders = Object.keys(window.ethereum);
      }

      setDebugInfo(info);
    };

    checkEnvironment();

    // Recheck after delay
    const timer = setTimeout(checkEnvironment, 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Wallet Connection Test</h1>

        {/* Connection Component */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Connect Wallet</h2>
          <ConnectWallet />
        </div>

        {/* Status */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Connection Status</h2>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-medium">MetaMask Installed:</span>
              <span className={isInstalled ? "text-green-600" : "text-red-600"}>
                {isInstalled ? "✓ Yes" : "✗ No"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Wallet Connected:</span>
              <span className={isConnected ? "text-green-600" : "text-gray-600"}>
                {isConnected ? "✓ Yes" : "✗ No"}
              </span>
            </div>
            {address && (
              <div className="flex items-center gap-2">
                <span className="font-medium">Address:</span>
                <span className="text-sm font-mono">{address}</span>
              </div>
            )}
            {chainId && (
              <div className="flex items-center gap-2">
                <span className="font-medium">Chain ID:</span>
                <span className="text-sm">{chainId}</span>
              </div>
            )}
          </div>
        </div>

        {/* Debug Info */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Debug Information</h2>
          <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>

        {/* Instructions */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">Troubleshooting Steps</h3>
          <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
            <li>Make sure MetaMask extension is installed in your browser</li>
            <li>Check that MetaMask is unlocked</li>
            <li>Try refreshing the page</li>
            <li>Check browser console for errors (F12 → Console tab)</li>
            <li>Try disabling other wallet extensions temporarily</li>
            <li>Make sure you're not in incognito/private mode</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
