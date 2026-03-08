import { ethers, BrowserProvider, Contract } from "ethers";
import { XRP_EVM_CONFIG } from "./config";

// ChallengeRewardDAO Contract ABI
export const DAO_ABI = [
  "function challengeCount() view returns (uint256)",
  "function submissionCount() view returns (uint256)",
  "function isDaoMember(address) view returns (bool)",
  "function challenges(uint256) view returns (uint256 id, string title, string description, address creator, uint256 rewardAmount, string escrowTxHash, uint256 votingDuration, bool active, uint256 createdAt)",
  "function submissions(uint256) view returns (uint256 id, uint256 challengeId, address submitter, string evidenceUrl, string xrplAddress, uint256 submittedAt, uint256 votingDeadline, uint8 status, uint256 approveVotes, uint256 denyVotes, bool finalized)",
  "function hasVoted(uint256, address) view returns (bool)",
  "function createChallenge(string title, string description, uint256 rewardAmount, string escrowTxHash, uint256 votingDuration) external returns (uint256)",
  "function submitEvidence(uint256 challengeId, string evidenceUrl, string xrplAddress) external returns (uint256)",
  "function vote(uint256 submissionId, bool approve) external",
  "function finalizeSubmission(uint256 submissionId) external",
  "event ChallengeCreated(uint256 indexed challengeId, string title, uint256 rewardAmount, string escrowTxHash)",
  "event SubmissionCreated(uint256 indexed submissionId, uint256 indexed challengeId, address submitter)",
  "event VoteCast(uint256 indexed submissionId, address voter, bool approve)",
  "event SubmissionFinalized(uint256 indexed submissionId, uint8 status)",
];

// DAO contract address — set via env or fallback
const DAO_ADDRESS = process.env.NEXT_PUBLIC_DAO_CONTRACT_ADDRESS || "0x0000000000000000000000000000000000000000";

export async function getDaoContractWithSigner(): Promise<Contract> {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("MetaMask not available");
  }
  const provider = new BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  return new Contract(DAO_ADDRESS, DAO_ABI, signer);
}

export function getDaoContractWithProvider(): Contract {
  const provider = new ethers.JsonRpcProvider(XRP_EVM_CONFIG.rpcUrl);
  return new Contract(DAO_ADDRESS, DAO_ABI, provider);
}
