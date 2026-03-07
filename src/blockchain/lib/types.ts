// Attestation Data Types

export interface HRZoneDistribution {
  zone1_rest: number;
  zone2_light: number;
  zone3_moderate: number;
  zone4_vigorous: number;
  zone5_max: number;
}

export interface AttestationData {
  activityType: string;
  durationMins: number;
  avgHr: number;
  maxHr: number;
  minHr: number;
  hrZoneDistribution: HRZoneDistribution;
  recoveryScore: number;
  confidence: number;
  dataHash: string;
  ipfsHash: string;
}

export interface AttestationResult {
  txHash: string;
  blockNumber: number;
  explorerUrl: string;
  attestationKey: string;
}

export interface OnChainAttestation {
  user: string;
  activityType: string;
  durationMins: number;
  avgHr: number;
  maxHr: number;
  minHr: number;
  hrZoneDistribution: string; // JSON string
  recoveryScore: number;
  confidence: number;
  dataHash: string;
  ipfsHash: string;
  oracle: string;
  timestamp: number;
  blockNumber: number;
}

// Wallet Types
export interface WalletContextType {
  address: string | null;
  isConnected: boolean;
  isInstalled: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  chainId: number | null;
}

// Hook Return Types
export interface UseAttestationReturn {
  submitAttestation: (data: AttestationData) => Promise<AttestationResult>;
  getAttestation: (key: string) => Promise<OnChainAttestation | null>;
  verifyAttestation: (key: string, minConfidence: number) => Promise<boolean>;
  isLoading: boolean;
  error: string | null;
}
