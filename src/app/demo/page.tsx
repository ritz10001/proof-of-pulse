"use client";

import { useState } from "react";
import { useWallet } from "@/blockchain/providers/WalletProvider";
import { useAttestation } from "@/blockchain/hooks/useAttestation";
import { ConnectWallet } from "@/blockchain/components/ConnectWallet";
import { AttestationResult } from "@/blockchain/components/AttestationResult";

export default function DemoPage() {
  const { address, isConnected } = useWallet();
  const { submitAttestation, isLoading } = useAttestation();
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [backendResult, setBackendResult] = useState<any>(null);

  // Sample heart rate data
  const sampleHRData = [
    { timestamp: "2024-01-01T10:00:00Z", bpm: 95 },
    { timestamp: "2024-01-01T10:00:05Z", bpm: 100 },
    { timestamp: "2024-01-01T10:00:10Z", bpm: 110 },
    { timestamp: "2024-01-01T10:00:15Z", bpm: 120 },
    { timestamp: "2024-01-01T10:00:20Z", bpm: 130 },
    { timestamp: "2024-01-01T10:00:25Z", bpm: 140 },
    { timestamp: "2024-01-01T10:00:30Z", bpm: 150 },
    { timestamp: "2024-01-01T10:00:35Z", bpm: 155 },
    { timestamp: "2024-01-01T10:00:40Z", bpm: 160 },
    { timestamp: "2024-01-01T10:00:45Z", bpm: 165 },
    { timestamp: "2024-01-01T10:00:50Z", bpm: 170 },
    { timestamp: "2024-01-01T10:00:55Z", bpm: 168 },
    { timestamp: "2024-01-01T10:01:00Z", bpm: 165 },
    { timestamp: "2024-01-01T10:01:05Z", bpm: 160 },
    { timestamp: "2024-01-01T10:01:10Z", bpm: 155 },
  ];

  const handleFullFlow = async () => {
    if (!isConnected || !address) {
      setError("Please connect your wallet first");
      return;
    }

    setError(null);
    setResult(null);
    setBackendResult(null);

    try {
      // Step 1: Send to backend for analysis
      console.log("Step 1: Analyzing with backend...");
      const backendResponse = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hr_samples: sampleHRData }),
      });

      if (!backendResponse.ok) {
        throw new Error("Backend analysis failed");
      }

      const backendData = await backendResponse.json();
      setBackendResult(backendData);
      console.log("Backend analysis complete:", backendData);

      // Step 2: Submit to blockchain via user's wallet
      console.log("Step 2: Submitting to blockchain...");
      const blockchainResult = await submitAttestation({
        activityType: backendData.attestation.activity_type,
        durationMins: backendData.attestation.duration_mins,
        avgHr: backendData.attestation.avg_hr,
        maxHr: backendData.attestation.max_hr,
        minHr: backendData.attestation.min_hr,
        hrZoneDistribution: backendData.attestation.hr_zone_distribution,
        recoveryScore: backendData.attestation.recovery_score,
        confidence: backendData.attestation.confidence,
        dataHash: backendData.attestation.data_hash,
        ipfsHash: "user-submitted-" + Date.now(), // In real app, this would come from backend
      });

      setResult(blockchainResult);
      console.log("Blockchain submission complete:", blockchainResult);
    } catch (err: any) {
      console.error("Error:", err);
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen p-8 bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Proof of Pulse Demo</h1>
          <p className="text-gray-600">
            Complete integration: Backend analysis + Blockchain attestation
          </p>
        </div>

        {/* Wallet Connection */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">1. Connect Wallet</h2>
          <ConnectWallet />
          {isConnected && address && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded">
              <p className="text-sm text-green-800">
                ✅ Connected: {address}
              </p>
            </div>
          )}
        </div>

        {/* Submit Attestation */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">2. Submit Attestation</h2>
          <p className="text-sm text-gray-600 mb-4">
            This will analyze your heart rate data with the backend, then submit
            the attestation to the blockchain via your MetaMask wallet.
          </p>
          <button
            onClick={handleFullFlow}
            disabled={!isConnected || isLoading}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed transition-all"
          >
            {isLoading ? "Processing..." : "Analyze & Submit to Blockchain"}
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <h3 className="text-red-800 font-semibold mb-2">Error</h3>
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Backend Analysis Result */}
        {backendResult && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">3. Backend Analysis</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Activity Type:</span>
                <span className="ml-2 font-medium">
                  {backendResult.attestation.activity_type}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Duration:</span>
                <span className="ml-2 font-medium">
                  {backendResult.attestation.duration_mins} mins
                </span>
              </div>
              <div>
                <span className="text-gray-600">Avg HR:</span>
                <span className="ml-2 font-medium">
                  {backendResult.attestation.avg_hr} bpm
                </span>
              </div>
              <div>
                <span className="text-gray-600">Max HR:</span>
                <span className="ml-2 font-medium">
                  {backendResult.attestation.max_hr} bpm
                </span>
              </div>
              <div>
                <span className="text-gray-600">Confidence:</span>
                <span className="ml-2 font-medium text-green-600">
                  {backendResult.attestation.confidence}%
                </span>
              </div>
              <div>
                <span className="text-gray-600">Recovery Score:</span>
                <span className="ml-2 font-medium">
                  {backendResult.attestation.recovery_score}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Blockchain Result */}
        {result && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">4. Blockchain Result</h2>
            <AttestationResult data={result} />
          </div>
        )}

        {/* Info Box */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">How it works</h3>
          <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
            <li>Connect your MetaMask wallet</li>
            <li>Backend analyzes heart rate data for fraud detection</li>
            <li>You sign the transaction with MetaMask</li>
            <li>Attestation is recorded on XRP EVM blockchain</li>
            <li>View your transaction on the explorer</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
