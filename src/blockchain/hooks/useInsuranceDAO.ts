"use client";

import { useState, useCallback } from "react";
import {
  getInsuranceDaoWithSigner,
  getInsuranceDaoWithProvider,
} from "../lib/insurance-dao-contract";
import { ethers } from "ethers";

export enum CaseStatus {
  Pending = 0,
  Approved = 1,
  Denied = 2,
}

export enum WellnessTier {
  HighRisk = 0,
  Standard = 1,
  Improved = 2,
  Premium = 3,
}

export const TIER_LABELS = ["High Risk", "Standard", "Improved", "Premium"];
export const TIER_COLORS = ["text-red-500", "text-foreground/60", "text-green-600", "text-pink-primary"];
export const STATUS_LABELS = ["Pending", "Approved", "Denied"];
export const PREMIUM_TABLE: Record<number, number> = { 0: 220, 1: 200, 2: 175, 3: 150 };

export interface WellnessCase {
  id: number;
  applicant: string;
  evidenceURI: string;
  proofHash: string;
  summary: string;
  wellnessScore: number;
  currentPremium: number;
  proposedPremium: number;
  requestedTier: number;
  createdAt: number;
  votingDeadline: number;
  approveVotes: number;
  denyVotes: number;
  finalized: boolean;
  status: number;
}

export function useInsuranceDAO() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCases = useCallback(async (): Promise<WellnessCase[]> => {
    try {
      const contract = getInsuranceDaoWithProvider();
      const count = Number(await contract.nextCaseId());
      const results: WellnessCase[] = [];
      for (let i = 0; i < count; i++) {
        const c = await contract.getWellnessCase(i);
        results.push({
          id: Number(c.id),
          applicant: c.applicant,
          evidenceURI: c.evidenceURI,
          proofHash: c.proofHash,
          summary: c.summary,
          wellnessScore: Number(c.wellnessScore),
          currentPremium: Number(c.currentPremium),
          proposedPremium: Number(c.proposedPremium),
          requestedTier: Number(c.requestedTier),
          createdAt: Number(c.createdAt),
          votingDeadline: Number(c.votingDeadline),
          approveVotes: Number(c.approveVotes),
          denyVotes: Number(c.denyVotes),
          finalized: c.finalized,
          status: Number(c.status),
        });
      }
      return results;
    } catch (err: any) {
      console.error("[InsuranceDAO] fetchCases failed:", err);
      return [];
    }
  }, []);

  const checkMembership = useCallback(async (address: string): Promise<boolean> => {
    try {
      const contract = getInsuranceDaoWithProvider();
      return await contract.isMember(address);
    } catch {
      return false;
    }
  }, []);

  const createWellnessCase = useCallback(async (
    evidenceURI: string,
    proofHash: string,
    summary: string,
    wellnessScore: number,
    votingPeriodSecs: number,
  ) => {
    setIsLoading(true);
    setError(null);
    try {
      const contract = await getInsuranceDaoWithSigner();
      const proofHashBytes = ethers.zeroPadValue(ethers.toBeHex(proofHash.startsWith("0x") ? proofHash : "0x" + proofHash, 32), 32);
      const tx = await contract.createWellnessCase(evidenceURI, proofHashBytes, summary, wellnessScore, votingPeriodSecs);
      const receipt = await tx.wait();
      return { txHash: tx.hash, blockNumber: receipt.blockNumber };
    } catch (err: any) {
      const msg = err.message || "Failed to create wellness case";
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const voteOnCase = useCallback(async (caseId: number, approve: boolean) => {
    setIsLoading(true);
    setError(null);
    try {
      const contract = await getInsuranceDaoWithSigner();
      const tx = await contract.voteOnCase(caseId, approve);
      await tx.wait();
      return { txHash: tx.hash };
    } catch (err: any) {
      setError(err.message || "Failed to vote");
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const finalizeCase = useCallback(async (caseId: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const contract = await getInsuranceDaoWithSigner();
      const tx = await contract.finalizeCase(caseId);
      await tx.wait();
      return { txHash: tx.hash };
    } catch (err: any) {
      setError(err.message || "Failed to finalize");
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const previewOutcome = useCallback(async (score: number): Promise<{ tier: number; premium: number }> => {
    try {
      const contract = getInsuranceDaoWithProvider();
      const result = await contract.previewScoreOutcome(score);
      return { tier: Number(result.tier), premium: Number(result.premium) };
    } catch {
      // Fallback to local calculation
      let tier = 0;
      if (score >= 85) tier = 3;
      else if (score >= 70) tier = 2;
      else if (score >= 50) tier = 1;
      return { tier, premium: PREMIUM_TABLE[tier] };
    }
  }, []);

  return {
    fetchCases,
    checkMembership,
    createWellnessCase,
    voteOnCase,
    finalizeCase,
    previewOutcome,
    isLoading,
    error,
  };
}
