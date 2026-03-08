import { NextResponse } from 'next/server';

// In-memory store for latest HR data (resets on server restart)
let latestHR: {
  bpm: number;
  min: number;
  max: number;
  date: string;
  source: string;
  totalSamples: number;
  receivedAt: number;
} | null = null;

export async function GET() {
  // Return latest stored HR data (used by frontend polling)
  if (latestHR) {
    return NextResponse.json({ success: true, ...latestHR });
  }
  return NextResponse.json({ success: false, message: "No HR data yet" });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const metrics = body.data?.metrics;
    const heartRateData = metrics?.find((m: any) => m.name === "heart_rate");

    if (heartRateData && heartRateData.data?.length > 0) {
      const samples = heartRateData.data;
      const latest = samples[samples.length - 1];
      const bpm = latest.Avg ?? latest.avg ?? latest.qty ?? latest.value;

      latestHR = {
        bpm,
        min: latest.Min,
        max: latest.Max,
        date: latest.date,
        source: latest.source,
        totalSamples: samples.length,
        receivedAt: Date.now(),
      };

      console.log(`[HR] ${samples.length} samples | Latest: ${bpm} BPM at ${latest.date} (Min:${latest.Min} Max:${latest.Max})`);

      return NextResponse.json({ success: true, ...latestHR });
    }

    return NextResponse.json({ success: false, message: "No HR data found" });
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }
}
