import { ethers } from "ethers";
import type { AttestationResult } from "../types";

const RPC_URL = process.env.XRP_EVM_RPC_URL || process.env.NEXT_PUBLIC_XRP_EVM_RPC_URL || "https://rpc.testnet.xrplevm.org";
const ORACLE_PRIVATE_KEY = process.env.ORACLE_PRIVATE_KEY;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;

// ProofOfPulse ABI (only the functions we need)
const CONTRACT_ABI = [
  "function submitAttestation(address user, string activityType, uint256 durationMins, uint256 avgHr, uint256 maxHr, uint256 minHr, string hrZoneDistribution, uint256 recoveryScore, uint256 confidence, string dataHash, string ipfsHash) external returns (string)",
  "function getAttestation(string key) external view returns (tuple(address user, string activityType, uint256 durationMins, uint256 avgHr, uint256 maxHr, uint256 minHr, string hrZoneDistribution, uint256 recoveryScore, uint256 confidence, string dataHash, string ipfsHash, address oracle, uint256 timestamp, uint256 blockNumber))",
  "function verifyAttestation(string key, uint256 minConfidence) external view returns (bool)",
  "function isAuthorizedOracle(address account) external view returns (bool)",
  "event AttestationSubmitted(string indexed key, address indexed user, uint256 confidence, string ipfsHash, address oracle)"
];

let provider: ethers.JsonRpcProvider;
let wallet: ethers.Wallet;
let contract: ethers.Contract;

function initializeContract() {
  if (!ORACLE_PRIVATE_KEY) {
    throw new Error("ORACLE_PRIVATE_KEY not set");
  }
  if (!CONTRACT_ADDRESS) {
    throw new Error("CONTRACT_ADDRESS not set");
  }

  provider = new ethers.JsonRpcProvider(RPC_URL);
  wallet = new ethers.Wallet(ORACLE_PRIVATE_KEY, provider);
  contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, wallet);

  console.log("[EVM] Initialized with oracle:", wallet.address);
  console.log("[EVM] Contract:", CONTRACT_ADDRESS);
}

export async function submitAttestation(
  userAddress: string,
  attestation: AttestationResult,
  ipfsHash: string
): Promise<{ txHash: string; blockNumber: number; explorerUrl: string; attestationKey: string }> {
  if (!contract) {
    initializeContract();
  }

  try {
    console.log("[EVM] Submitting attestation for user:", userAddress);

    // Create data hash from attestation
    const dataHash = ethers.keccak256(
      ethers.toUtf8Bytes(JSON.stringify({
        user: userAddress,
        confidence: attestation.confidence,
        timestamp: Date.now()
      }))
    );

    // Submit transaction
    const tx = await contract.submitAttestation(
      userAddress,
      attestation.activity_type,
      attestation.duration_mins,
      attestation.avg_hr,
      attestation.max_hr,
      attestation.min_hr,
      JSON.stringify(attestation.hr_zone_distribution),
      attestation.recovery_score,
      attestation.confidence,
      dataHash,
      ipfsHash
    );

    console.log("[EVM] Transaction sent:", tx.hash);

    // Wait for confirmation
    const receipt = await tx.wait();
    console.log("[EVM] Transaction confirmed in block:", receipt.blockNumber);

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

    const explorerUrl = `https://explorer.testnet.xrplevm.org/tx/${tx.hash}`;

    return {
      txHash: tx.hash,
      blockNumber: receipt.blockNumber,
      explorerUrl,
      attestationKey
    };
  } catch (error: any) {
    console.error("[EVM] Submission failed:", error);
    throw new Error(`EVM submission failed: ${error.message}`);
  }
}

export async function getAttestation(key: string) {
  if (!contract) {
    initializeContract();
  }

  try {
    const attestation = await contract.getAttestation(key);
    return {
      user: attestation.user,
      activityType: attestation.activityType,
      durationMins: Number(attestation.durationMins),
      avgHr: Number(attestation.avgHr),
      maxHr: Number(attestation.maxHr),
      minHr: Number(attestation.minHr),
      hrZoneDistribution: JSON.parse(attestation.hrZoneDistribution),
      recoveryScore: Number(attestation.recoveryScore),
      confidence: Number(attestation.confidence),
      dataHash: attestation.dataHash,
      ipfsHash: attestation.ipfsHash,
      oracle: attestation.oracle,
      timestamp: Number(attestation.timestamp),
      blockNumber: Number(attestation.blockNumber)
    };
  } catch (error: any) {
    console.error("[EVM] Get attestation failed:", error);
    throw new Error(`Failed to get attestation: ${error.message}`);
  }
}

export async function verifyAttestation(key: string, minConfidence: number): Promise<boolean> {
  if (!contract) {
    initializeContract();
  }

  try {
    return await contract.verifyAttestation(key, minConfidence);
  } catch (error: any) {
    console.error("[EVM] Verify attestation failed:", error);
    return false;
  }
}
