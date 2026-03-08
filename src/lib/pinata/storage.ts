/**
 * Pinata IPFS Storage Module
 * Handles decentralized storage of heart rate data
 */

import { createHash } from "node:crypto";
import type { HRSample } from "../types";

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

/**
 * Upload heart rate session data to Pinata IPFS
 */
export async function uploadToPinata(
  samples: HRSample[],
  userId: string,
  sessionDate: string
): Promise<PinataStorageResult> {
  const jwt = process.env.PINATA_JWT;
  
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
