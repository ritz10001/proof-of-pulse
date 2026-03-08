import { ethers, BrowserProvider, Contract } from "ethers";
import { XRP_EVM_CONFIG } from "./config";
import type { AttestationData, AttestationResult, OnChainAttestation } from "./types";

// ProofOfPulse Smart Contract ABI
export const CONTRACT_ABI = [
  "function submitAttestation(address user, string activityType, uint256 durationMins, uint256 avgHr, uint256 maxHr, uint256 minHr, string hrZoneDistribution, uint256 recoveryScore, uint256 confidence, string dataHash, string ipfsHash) external returns (string)",
  "function getAttestation(string key) external view returns (tuple(address user, string activityType, uint256 durationMins, uint256 avgHr, uint256 maxHr, uint256 minHr, string hrZoneDistribution, uint256 recoveryScore, uint256 confidence, string dataHash, string ipfsHash, address oracle, uint256 timestamp, uint256 blockNumber))",
  "function verifyAttestation(string key, uint256 minConfidence) external view returns (bool)",
  "function isAuthorizedOracle(address account) external view returns (bool)",
  "event AttestationSubmitted(string indexed key, address indexed user, uint256 confidence, string ipfsHash, address oracle)"
];

/**
 * Get contract instance with signer (for write operations)
 */
export async function getContractWithSigner(): Promise<Contract> {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("MetaMask not available");
  }

  const provider = new BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  
  return new Contract(
    XRP_EVM_CONFIG.contractAddress,
    CONTRACT_ABI,
    signer
  );
}

/**
 * Get contract instance with provider (for read operations)
 */
export function getContractWithProvider(): Contract {
  const provider = new ethers.JsonRpcProvider(XRP_EVM_CONFIG.rpcUrl);
  
  return new Contract(
    XRP_EVM_CONFIG.contractAddress,
    CONTRACT_ABI,
    provider
  );
}

/**
 * Submit attestation to blockchain
 */
export async function submitAttestation(
  userAddress: string,
  data: AttestationData
): Promise<AttestationResult> {
  try {
    const contract = await getContractWithSigner();

    // Submit transaction
    const tx = await contract.submitAttestation(
      userAddress,
      data.activityType,
      data.durationMins,
      data.avgHr,
      data.maxHr,
      data.minHr,
      JSON.stringify(data.hrZoneDistribution),
      data.recoveryScore,
      data.confidence,
      data.dataHash,
      data.ipfsHash
    );

    console.log("[Contract] Transaction sent:", tx.hash);

    // Wait for confirmation
    const receipt = await tx.wait();
    console.log("[Contract] Transaction confirmed in block:", receipt.blockNumber);

    // Extract attestation key from event
    const event = receipt.logs
      .map((log: any) => {
        try {
          return contract.interface.parseLog(log);
        } catch {
          return null;
        }
      })
      .find((e: any) => e && e.name === "AttestationSubmitted");

    const attestationKey = event?.args?.key || `${userAddress}:${Date.now()}`;

    return {
      txHash: tx.hash,
      blockNumber: receipt.blockNumber,
      explorerUrl: `${XRP_EVM_CONFIG.explorerUrl}/tx/${tx.hash}`,
      attestationKey
    };
  } catch (error: any) {
    console.error("[Contract] Submission failed:", error);
    throw new Error(`Failed to submit attestation: ${error.message}`);
  }
}

/**
 * Get attestation from blockchain
 */
export async function getAttestation(key: string): Promise<OnChainAttestation | null> {
  try {
    const contract = getContractWithProvider();
    const attestation = await contract.getAttestation(key);

    // Check if attestation exists (timestamp > 0)
    if (Number(attestation.timestamp) === 0) {
      return null;
    }

    return {
      user: attestation.user,
      activityType: attestation.activityType,
      durationMins: Number(attestation.durationMins),
      avgHr: Number(attestation.avgHr),
      maxHr: Number(attestation.maxHr),
      minHr: Number(attestation.minHr),
      hrZoneDistribution: attestation.hrZoneDistribution,
      recoveryScore: Number(attestation.recoveryScore),
      confidence: Number(attestation.confidence),
      dataHash: attestation.dataHash,
      ipfsHash: attestation.ipfsHash,
      oracle: attestation.oracle,
      timestamp: Number(attestation.timestamp),
      blockNumber: Number(attestation.blockNumber)
    };
  } catch (error: any) {
    console.error("[Contract] Get attestation failed:", error);
    return null;
  }
}

/**
 * Verify attestation meets minimum confidence
 */
export async function verifyAttestation(
  key: string,
  minConfidence: number
): Promise<boolean> {
  try {
    const contract = getContractWithProvider();
    return await contract.verifyAttestation(key, minConfidence);
  } catch (error: any) {
    console.error("[Contract] Verify attestation failed:", error);
    return false;
  }
}

declare global {
  interface Window {
    ethereum?: any;
  }
}
