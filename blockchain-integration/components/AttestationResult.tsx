"use client";

import type { AttestationResult } from "../lib/types";

interface AttestationResultProps {
  data: AttestationResult;
  className?: string;
}

export function AttestationResult({ data, className = "" }: AttestationResultProps) {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  return (
    <div className={`border rounded-lg p-6 bg-white shadow-sm ${className}`}>
      <h3 className="text-lg font-semibold mb-4">Attestation Submitted ✅</h3>
      
      <div className="space-y-3">
        <div>
          <label className="text-sm text-gray-600">Transaction Hash:</label>
          <div className="flex items-center gap-2">
            <code className="text-sm bg-gray-100 px-2 py-1 rounded flex-1 overflow-x-auto">
              {data.txHash}
            </code>
            <button
              onClick={() => copyToClipboard(data.txHash)}
              className="text-blue-500 hover:text-blue-600 text-sm"
            >
              Copy
            </button>
          </div>
        </div>

        <div>
          <label className="text-sm text-gray-600">Block Number:</label>
          <p className="text-sm font-mono">{data.blockNumber}</p>
        </div>

        <div>
          <label className="text-sm text-gray-600">Attestation Key:</label>
          <div className="flex items-center gap-2">
            <code className="text-sm bg-gray-100 px-2 py-1 rounded flex-1 overflow-x-auto">
              {data.attestationKey}
            </code>
            <button
              onClick={() => copyToClipboard(data.attestationKey)}
              className="text-blue-500 hover:text-blue-600 text-sm"
            >
              Copy
            </button>
          </div>
        </div>

        <div className="pt-4">
          <a
            href={data.explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            View on Explorer →
          </a>
        </div>
      </div>
    </div>
  );
}
