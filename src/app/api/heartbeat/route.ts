import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ status: "ok", endpoint: "POST /api/heartbeat" });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const metrics = body.data?.metrics;
    const heartRateData = metrics?.find((m: any) => m.name === "heart_rate");

    if (heartRateData && heartRateData.data.length > 0) {
      const latest = heartRateData.data[0];
      console.log(`BPM Received: ${latest.qty} at ${latest.date}`);

      // TODO: persist to database or in-memory store for frontend consumption
      return NextResponse.json({ success: true, bpm: latest.qty });
    }

    return NextResponse.json({ success: false, message: "No HR data found" });
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }
}
