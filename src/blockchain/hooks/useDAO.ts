"use client";

import { useState, useCallback } from "react";
import { getDaoContractWithSigner, getDaoContractWithProvider } from "../lib/dao-contract";

export interface Challenge {
  id: number;
  title: string;
  description: string;
  creator: string;
  rewardAmount: bigint;
  escrowTxHash: string;
  votingDuration: number;
  active: boolean;
  createdAt: number;
}

export interface Submission {
  id: number;
  challengeId: number;
  submitter: string;
  evidenceUrl: string;
  xrplAddress: string;
  submittedAt: number;
  votingDeadline: number;
  status: number; // 0=Pending, 1=Approved, 2=Denied
  approveVotes: number;
  denyVotes: number;
  finalized: boolean;
}

export function useDAO() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchChallenges = useCallback(async (): Promise<Challenge[]> => {
    try {
      const contract = getDaoContractWithProvider();
      const count = Number(await contract.challengeCount());
      const results: Challenge[] = [];
      for (let i = 1; i <= count; i++) {
        const c = await contract.challenges(i);
        results.push({
          id: Number(c.id),
          title: c.title,
          description: c.description,
          creator: c.creator,
          rewardAmount: c.rewardAmount,
          escrowTxHash: c.escrowTxHash,
          votingDuration: Number(c.votingDuration),
          active: c.active,
          createdAt: Number(c.createdAt),
        });
      }
      return results;
    } catch (err: any) {
      console.error("[DAO] fetchChallenges failed:", err);
      return [];
    }
  }, []);

  const fetchSubmissions = useCallback(async (): Promise<Submission[]> => {
    try {
      const contract = getDaoContractWithProvider();
      const count = Number(await contract.submissionCount());
      const results: Submission[] = [];
      for (let i = 1; i <= count; i++) {
        const s = await contract.submissions(i);
        results.push({
          id: Number(s.id),
          challengeId: Number(s.challengeId),
          submitter: s.submitter,
          evidenceUrl: s.evidenceUrl,
          xrplAddress: s.xrplAddress,
          submittedAt: Number(s.submittedAt),
          votingDeadline: Number(s.votingDeadline),
          status: Number(s.status),
          approveVotes: Number(s.approveVotes),
          denyVotes: Number(s.denyVotes),
          finalized: s.finalized,
        });
      }
      return results;
    } catch (err: any) {
      console.error("[DAO] fetchSubmissions failed:", err);
      return [];
    }
  }, []);

  const createChallenge = useCallback(async (
    title: string,
    description: string,
    rewardAmount: bigint,
    escrowTxHash: string,
    votingDurationSecs: number,
  ) => {
    setIsLoading(true);
    setError(null);
    try {
      const contract = await getDaoContractWithSigner();
      const tx = await contract.createChallenge(title, description, rewardAmount, escrowTxHash, votingDurationSecs);
      const receipt = await tx.wait();
      return { txHash: tx.hash, blockNumber: receipt.blockNumber };
    } catch (err: any) {
      setError(err.message || "Failed to create challenge");
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const submitEvidence = useCallback(async (
    challengeId: number,
    evidenceUrl: string,
    xrplAddress: string,
  ) => {
    setIsLoading(true);
    setError(null);
    try {
      const contract = await getDaoContractWithSigner();
      const tx = await contract.submitEvidence(challengeId, evidenceUrl, xrplAddress);
      const receipt = await tx.wait();
      return { txHash: tx.hash, blockNumber: receipt.blockNumber };
    } catch (err: any) {
      setError(err.message || "Failed to submit evidence");
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const vote = useCallback(async (submissionId: number, approve: boolean) => {
    setIsLoading(true);
    setError(null);
    try {
      const contract = await getDaoContractWithSigner();
      const tx = await contract.vote(submissionId, approve);
      await tx.wait();
      return { txHash: tx.hash };
    } catch (err: any) {
      setError(err.message || "Failed to vote");
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const finalizeSubmission = useCallback(async (submissionId: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const contract = await getDaoContractWithSigner();
      const tx = await contract.finalizeSubmission(submissionId);
      await tx.wait();
      return { txHash: tx.hash };
    } catch (err: any) {
      setError(err.message || "Failed to finalize");
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    fetchChallenges,
    fetchSubmissions,
    createChallenge,
    submitEvidence,
    vote,
    finalizeSubmission,
    isLoading,
    error,
  };
}
