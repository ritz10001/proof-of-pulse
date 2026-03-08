import { ethers, BrowserProvider, Contract } from "ethers";
import { XRP_EVM_CONFIG } from "./config";

export const INSURANCE_DAO_ABI = [
  // Read functions
  "function owner() view returns (address)",
  "function nextCaseId() view returns (uint256)",
  "function minVotingPeriod() view returns (uint256)",
  "function isMember(address) view returns (bool)",
  "function hasVoted(uint256, address) view returns (bool)",
  "function getWellnessCase(uint256 caseId) view returns (tuple(uint256 id, address applicant, string evidenceURI, bytes32 proofHash, string summary, uint256 wellnessScore, uint256 currentPremium, uint256 proposedPremium, uint8 requestedTier, uint256 createdAt, uint256 votingDeadline, uint256 approveVotes, uint256 denyVotes, bool finalized, uint8 status))",
  "function didVote(uint256 caseId, address voter) view returns (bool)",
  "function previewScoreOutcome(uint256 wellnessScore) view returns (uint8 tier, uint256 premium)",

  // Write functions
  "function addMember(address member) external",
  "function removeMember(address member) external",
  "function setMinVotingPeriod(uint256 newPeriod) external",
  "function createWellnessCase(string evidenceURI, bytes32 proofHash, string summary, uint256 wellnessScore, uint256 votingPeriod) external returns (uint256 caseId)",
  "function voteOnCase(uint256 caseId, bool approve) external",
  "function finalizeCase(uint256 caseId) external",

  // Events
  "event MemberAdded(address indexed member)",
  "event MemberRemoved(address indexed member)",
  "event WellnessCaseCreated(uint256 indexed caseId, address indexed applicant, uint256 wellnessScore, uint8 requestedTier, uint256 currentPremium, uint256 proposedPremium, uint256 votingDeadline)",
  "event VoteCast(uint256 indexed caseId, address indexed voter, bool approve)",
  "event WellnessCaseFinalized(uint256 indexed caseId, address indexed applicant, uint8 status, uint256 finalPremium, uint8 finalTier)",
  "event RebateApprovedForEscrow(uint256 indexed caseId, address indexed applicant, uint256 rebateAmount, uint256 approvedPremium)",
];

const INSURANCE_DAO_ADDRESS = process.env.NEXT_PUBLIC_INSURANCE_DAO_ADDRESS || "0x0000000000000000000000000000000000000000";

export async function getInsuranceDaoWithSigner(): Promise<Contract> {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("MetaMask not available");
  }
  const provider = new BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  return new Contract(INSURANCE_DAO_ADDRESS, INSURANCE_DAO_ABI, signer);
}

export function getInsuranceDaoWithProvider(): Contract {
  const provider = new ethers.JsonRpcProvider(XRP_EVM_CONFIG.rpcUrl);
  return new Contract(INSURANCE_DAO_ADDRESS, INSURANCE_DAO_ABI, provider);
}
