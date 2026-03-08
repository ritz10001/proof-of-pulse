import { NextRequest, NextResponse } from "next/server";
import { analyzeWorkout } from "@/lib/engine/attestation-engine";
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

    if (!body.hr_samples || body.hr_samples.length === 0) {
      return NextResponse.json(
        { error: "hr_samples is required" },
        { status: 400 }
      );
    }

    if (body.hr_samples.length < 10) {
      return NextResponse.json(
        { error: "Insufficient HR data (minimum 10 samples)" },
        { status: 400 }
      );
    }

    const session = buildSession(body.hr_samples);
    const attestation = analyzeWorkout(session);

    // Build HR timeline for frontend chart (downsample to ~150 points)
    const step = Math.max(1, Math.floor(session.samples.length / 150));
    const hr_timeline = session.samples
      .filter((_, i) => i % step === 0)
      .map((s) => ({ time: s.timestamp.toISOString(), bpm: Math.round(s.bpm) }));

    return NextResponse.json({
      attestation,
      session_info: {
        start: session.startDate.toISOString(),
        end: session.endDate.toISOString(),
        sample_count: session.samples.length,
        duration_mins: session.durationMins,
      },
      hr_timeline,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: `Analysis failed: ${err.message}` },
      { status: 500 }
    );
  }
}
