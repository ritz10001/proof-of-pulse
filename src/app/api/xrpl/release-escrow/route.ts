import { NextRequest, NextResponse } from "next/server";
import { finishEscrow } from "@/lib/xrpl/escrow";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { escrowOwner, escrowSequence } = body;

    if (!escrowOwner || escrowSequence === undefined) {
      return NextResponse.json(
        { error: "escrowOwner and escrowSequence are required" },
        { status: 400 }
      );
    }

    const result = await finishEscrow({
      escrowOwner,
      escrowSequence: Number(escrowSequence),
    });

    return NextResponse.json({
      success: result.success,
      txHash: result.txHash,
      explorer_url: `https://devnet.xrpl.org/transactions/${result.txHash}`,
    });
  } catch (err: any) {
    console.error("[XRPL] Release escrow failed:", err);
    return NextResponse.json(
      { error: `Escrow release failed: ${err.message}` },
      { status: 500 }
    );
  }
}
