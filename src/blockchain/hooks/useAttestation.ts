import { useState, useCallback } from "react";
import { useWallet } from "../providers/WalletProvider";
import { submitAttestation as submitToContract, getAttestation as getFromContract, verifyAttestation as verifyFromContract } from "../lib/contract";
import type { AttestationData, AttestationResult, OnChainAttestation, UseAttestationReturn } from "../lib/types";

export function useAttestation(): UseAttestationReturn {
  const { address, isConnected } = useWallet();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitAttestation = useCallback(async (data: AttestationData): Promise<AttestationResult> => {
    if (!isConnected || !address) {
      throw new Error("Wallet not connected");
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await submitToContract(address, data);
      return result;
    } catch (err: any) {
      const errorMessage = err.message || "Failed to submit attestation";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [address, isConnected]);

  const getAttestation = useCallback(async (key: string): Promise<OnChainAttestation | null> => {
    setError(null);

    try {
      return await getFromContract(key);
    } catch (err: any) {
      const errorMessage = err.message || "Failed to get attestation";
      setError(errorMessage);
      return null;
    }
  }, []);

  const verifyAttestation = useCallback(async (key: string, minConfidence: number): Promise<boolean> => {
    setError(null);

    try {
      return await verifyFromContract(key, minConfidence);
    } catch (err: any) {
      const errorMessage = err.message || "Failed to verify attestation";
      setError(errorMessage);
      return false;
    }
  }, []);

  return {
    submitAttestation,
    getAttestation,
    verifyAttestation,
    isLoading,
    error,
  };
}
