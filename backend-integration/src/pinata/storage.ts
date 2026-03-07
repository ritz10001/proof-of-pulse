/**
 * Pinata IPFS Storage Module
 * Replaces NOVA Privacy Vault with Pinata for decentralized storage
 */

import { createHash } from "node:crypto";
import type { HRSample } from "../types.js";

interface PinataUploadResponse {
  IpfsHash: string;
  PinSize: number;
  Timestamp: string;
}

interface PinataStorageResult {
  ipfsHash: string;
  fileHash: string;
  pinataUrl: string;
  gatewayUrl: string;
  pinSize: number;
}

// Lazy-initialized Pinata configuration
let _pinataJWT: string | null = null;

function getPinataJWT(): string {
  if (_pinataJWT) return _pinataJWT;
  
  const jwt = process.env.PINATA_JWT;
  if (!jwt) {
    console.warn("[Pinata] PINATA_JWT not set — using mock mode");
    return "";
  }
  
  _pinataJWT = jwt;
  console.log("[Pinata] JWT configured");
  return _pinataJWT;
}

export function isPinataConfigured(): boolean {
  return !!process.env.PINATA_JWT;
}

/**
 * Upload heart rate session data to Pinata IPFS
 */
export async function uploadToPinata(
  samples: HRSample[],
  userId: string,
  sessionDate: string
): Promise<PinataStorageResult> {
  const jwt = getPinataJWT();
  
  // Prepare data payload
  const payload = {
    user_id: userId,
    session_date: sessionDate,
    timestamp: new Date().toISOString(),
    sample_count: samples.length,
    samples: samples.map((s) => ({
      timestamp: s.timestamp.toISOString(),
      bpm: s.bpm,
      source: s.source,
    })),
  };
  
  const dataString = JSON.stringify(payload, null, 2);
  const dataBuffer = Buffer.from(dataString, "utf-8");
  
  // Calculate file hash
  const fileHash = createHash("sha256").update(dataBuffer).digest("hex");
  
  // Mock mode if no JWT
  if (!jwt) {
    console.warn("[Pinata] Mock mode - data not actually uploaded");
    return {
      ipfsHash: `mock-ipfs-${Date.now()}`,
      fileHash,
      pinataUrl: `https://pinata.cloud/mock/${Date.now()}`,
      gatewayUrl: `https://gateway.pinata.cloud/ipfs/mock-${Date.now()}`,
      pinSize: dataBuffer.length,
    };
  }
  
  // Upload to Pinata
  try {
    const formData = new FormData();
    const blob = new Blob([dataBuffer], { type: "application/json" });
    const filename = `proof-of-pulse-${userId}-${sessionDate}-${Date.now()}.json`;
    
    formData.append("file", blob, filename);
    
    // Add metadata
    const metadata = JSON.stringify({
      name: filename,
      keyvalues: {
        user_id: userId,
        session_date: sessionDate,
        sample_count: samples.length.toString(),
        file_hash: fileHash,
      },
    });
    formData.append("pinataMetadata", metadata);
    
    // Add options
    const options = JSON.stringify({
      cidVersion: 1,
    });
    formData.append("pinataOptions", options);
    
    const response = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
      body: formData,
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Pinata upload failed: ${response.status} ${error}`);
    }
    
    const result: PinataUploadResponse = await response.json();
    
    console.log(`[Pinata] Uploaded ${samples.length} HR samples to IPFS: ${result.IpfsHash}`);
    
    return {
      ipfsHash: result.IpfsHash,
      fileHash,
      pinataUrl: `https://pinata.cloud/pinatacloud/ipfs/${result.IpfsHash}`,
      gatewayUrl: `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`,
      pinSize: result.PinSize,
    };
  } catch (error) {
    console.error("[Pinata] Upload error:", error);
    throw error;
  }
}

/**
 * Retrieve data from Pinata IPFS
 */
export async function retrieveFromPinata(ipfsHash: string): Promise<any> {
  const jwt = getPinataJWT();
  
  if (!jwt) {
    console.warn("[Pinata] Mock mode - cannot retrieve data");
    return null;
  }
  
  try {
    const response = await fetch(`https://gateway.pinata.cloud/ipfs/${ipfsHash}`, {
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to retrieve from IPFS: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("[Pinata] Retrieve error:", error);
    throw error;
  }
}

/**
 * List all pins for the account
 */
export async function listPins(): Promise<any[]> {
  const jwt = getPinataJWT();
  
  if (!jwt) {
    console.warn("[Pinata] Mock mode - no pins to list");
    return [];
  }
  
  try {
    const response = await fetch("https://api.pinata.cloud/data/pinList?status=pinned", {
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to list pins: ${response.status}`);
    }
    
    const result = await response.json();
    return result.rows || [];
  } catch (error) {
    console.error("[Pinata] List pins error:", error);
    return [];
  }
}

/**
 * Unpin (delete) a file from Pinata
 */
export async function unpinFromPinata(ipfsHash: string): Promise<boolean> {
  const jwt = getPinataJWT();
  
  if (!jwt) {
    console.warn("[Pinata] Mock mode - cannot unpin");
    return false;
  }
  
  try {
    const response = await fetch(`https://api.pinata.cloud/pinning/unpin/${ipfsHash}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to unpin: ${response.status}`);
    }
    
    console.log(`[Pinata] Unpinned ${ipfsHash}`);
    return true;
  } catch (error) {
    console.error("[Pinata] Unpin error:", error);
    return false;
  }
}

/**
 * Get pin metadata
 */
export async function getPinMetadata(ipfsHash: string): Promise<any> {
  const jwt = getPinataJWT();
  
  if (!jwt) {
    return null;
  }
  
  try {
    const response = await fetch(
      `https://api.pinata.cloud/data/pinList?hashContains=${ipfsHash}`,
      {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to get metadata: ${response.status}`);
    }
    
    const result = await response.json();
    return result.rows?.[0] || null;
  } catch (error) {
    console.error("[Pinata] Get metadata error:", error);
    return null;
  }
}
