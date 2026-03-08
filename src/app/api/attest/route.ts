import { NextRequest, NextResponse } from "next/server";
import { analyzeWorkout } from "@/lib/engine/attestation-engine";
import { submitAttestation } from "@/lib/evm/submitter";
import { uploadToPinata } from "@/lib/pinata/storage";
import type { HRSampleInput, WorkoutSession } from "@/lib/types";

/**
 * Build a WorkoutSession from JSON HR sample inputs.
 */
function buildSession(hrSamples: HRSampleInput[]): WorkoutSession {
  const samples = hrSamples.map((s) => ({
    timestamp: new Date(s.timestamp),
    bpm: s.bpm,
    source: "shade-agent",
  }));

  samples.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  const startDate = samples[0].timestamp;
  const endDate = samples[samples.length - 1].timestamp;
  const durationMins = Math.round(
    (endDate.getTime() - startDate.getTime()) / 60000
  );

  return { startDate, endDate, samples, durationMins };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, hr_samples } = body;

    if (!user_id) {
      return NextResponse.json(
        { error: "user_id is required (wallet address)" },
        { status: 400 }
      );
    }

    if (!hr_samples || hr_samples.length === 0) {
      return NextResponse.json(
        { error: "hr_samples is required" },
        { status: 400 }
      );
    }

    if (hr_samples.length < 10) {
      return NextResponse.json(
        { error: "Insufficient HR data (minimum 10 samples)" },
        { status: 400 }
      );
    }

    const session = buildSession(hr_samples);

    // 1. Analyze
    const attestation = analyzeWorkout(session);

    // Build HR timeline for frontend chart
    const step = Math.max(1, Math.floor(session.samples.length / 150));
    const hr_timeline = session.samples
      .filter((_, i) => i % step === 0)
      .map((s) => ({ time: s.timestamp.toISOString(), bpm: Math.round(s.bpm) }));

    // 2. Store raw HR data in Pinata IPFS
    let pinataResult = null;
    let storageId = `fallback_${Date.now()}`;

    try {
      pinataResult = await uploadToPinata(
        session.samples,
        user_id,
        new Date().toISOString().split("T")[0]
      );
      storageId = pinataResult.ipfsHash;
    } catch (err: any) {
      console.warn(`[Pinata] Storage failed: ${err.message}`);
    }

    // 3. Submit to XRP EVM Sidechain
    try {
      const { txHash, blockNumber, explorerUrl, attestationKey } =
        await submitAttestation(user_id, attestation, storageId);

      return NextResponse.json({
        attestation,
        hr_timeline,
        tx_hash: txHash,
        block_number: blockNumber,
        attestation_key: attestationKey,
        storage_id: storageId,
        storage_type: "pinata_ipfs",
        pinata: pinataResult
          ? {
              ipfs_hash: pinataResult.ipfsHash,
              file_hash: pinataResult.fileHash,
              gateway_url: pinataResult.gatewayUrl,
              pin_size: pinataResult.pinSize,
            }
          : null,
        explorer_url: explorerUrl,
        oracle_type: "shade_agent_tee",
        blockchain: "xrp_evm_sidechain",
      });
    } catch (err: any) {
      return NextResponse.json(
        {
          attestation,
          hr_timeline,
          tx_hash: null,
          storage_id: storageId,
          error: `EVM submission failed: ${err.message}`,
          oracle_type: "shade_agent_tee",
        },
        { status: 500 }
      );
    }
  } catch (err: any) {
    return NextResponse.json(
      { error: `Attestation failed: ${err.message}` },
      { status: 500 }
    );
  }
}
