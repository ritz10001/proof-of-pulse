"use client";

import { useState } from "react";

export default function TestBackendPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Sample heart rate data for testing
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

  const testAnalyze = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hr_samples: sampleHRData }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Analysis failed");
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const testAttest = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/attest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: "0x2B650F7565629b54fc476152e4aCbD9C1A4DEF9B",
          hr_samples: sampleHRData,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Attestation failed");
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Backend Integration Test</h1>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Endpoints</h2>
          
          <div className="space-y-4">
            <div>
              <button
                onClick={testAnalyze}
                disabled={loading}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? "Testing..." : "Test /api/analyze"}
              </button>
              <p className="text-sm text-gray-600 mt-2">
                Analyzes heart rate data without blockchain submission
              </p>
            </div>

            <div>
              <button
                onClick={testAttest}
                disabled={loading}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? "Testing..." : "Test /api/attest"}
              </button>
              <p className="text-sm text-gray-600 mt-2">
                Full flow: analyze + IPFS storage + blockchain submission
                <br />
                <span className="text-orange-600">
                  ⚠️ Requires ORACLE_PRIVATE_KEY and PINATA_JWT in .env.local
                </span>
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <h3 className="text-red-800 font-semibold mb-2">Error</h3>
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {result && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-semibold mb-4">Result</h3>
            
            {result.attestation && (
              <div className="mb-6">
                <h4 className="font-semibold mb-2">Attestation</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Activity Type:</span>
                    <span className="ml-2 font-medium">{result.attestation.activity_type}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Duration:</span>
                    <span className="ml-2 font-medium">{result.attestation.duration_mins} mins</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Avg HR:</span>
                    <span className="ml-2 font-medium">{result.attestation.avg_hr} bpm</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Max HR:</span>
                    <span className="ml-2 font-medium">{result.attestation.max_hr} bpm</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Confidence:</span>
                    <span className="ml-2 font-medium text-green-600">
                      {result.attestation.confidence}%
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Recovery Score:</span>
                    <span className="ml-2 font-medium">{result.attestation.recovery_score}</span>
                  </div>
                </div>
              </div>
            )}

            {result.tx_hash && (
              <div className="mb-6">
                <h4 className="font-semibold mb-2">Blockchain</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-600">Transaction:</span>
                    <a
                      href={result.explorer_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 text-blue-600 hover:underline"
                    >
                      {result.tx_hash.slice(0, 10)}...{result.tx_hash.slice(-8)}
                    </a>
                  </div>
                  <div>
                    <span className="text-gray-600">Block:</span>
                    <span className="ml-2 font-medium">{result.block_number}</span>
                  </div>
                </div>
              </div>
            )}

            {result.pinata && (
              <div className="mb-6">
                <h4 className="font-semibold mb-2">IPFS Storage</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-600">IPFS Hash:</span>
                    <a
                      href={result.pinata.gateway_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 text-blue-600 hover:underline"
                    >
                      {result.pinata.ipfs_hash}
                    </a>
                  </div>
                  <div>
                    <span className="text-gray-600">Size:</span>
                    <span className="ml-2 font-medium">{result.pinata.pin_size} bytes</span>
                  </div>
                </div>
              </div>
            )}

            <details className="mt-6">
              <summary className="cursor-pointer font-semibold text-gray-700 hover:text-gray-900">
                View Full Response
              </summary>
              <pre className="mt-4 p-4 bg-gray-100 rounded text-xs overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </details>
          </div>
        )}

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">Configuration</h3>
          <p className="text-sm text-blue-800">
            To test the full attestation flow, add your credentials to <code className="bg-blue-100 px-1 rounded">.env.local</code>:
          </p>
          <ul className="mt-2 text-sm text-blue-800 list-disc list-inside space-y-1">
            <li>ORACLE_PRIVATE_KEY - Your oracle wallet private key</li>
            <li>PINATA_JWT - Your Pinata API JWT token</li>
          </ul>
          <p className="mt-2 text-sm text-blue-800">
            See <code className="bg-blue-100 px-1 rounded">BACKEND_INTEGRATION_README.md</code> for details.
          </p>
        </div>
      </div>
    </div>
  );
}
