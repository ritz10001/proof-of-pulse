import { NextRequest, NextResponse } from "next/server";
import { createEscrow, fundEscrowWallet } from "@/lib/xrpl/escrow";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amountXrp, destinationAddress } = body;

    if (!amountXrp || !destinationAddress) {
      return NextResponse.json(
        { error: "amountXrp and destinationAddress are required" },
        { status: 400 }
      );
    }

    // Ensure escrow wallet is funded (Devnet faucet)
    await fundEscrowWallet();

    // Create the escrow — 60s finishAfter for demo speed, 24h cancel
    const result = await createEscrow({
      amountXrp: String(amountXrp),
      destinationAddress,
      finishAfterSeconds: 60,  // Can be finished 60s after creation
      cancelAfterSeconds: 86400,
    });

    return NextResponse.json({
      success: true,
      escrow: result,
      explorer_url: `https://devnet.xrpl.org/transactions/${result.txHash}`,
    });
  } catch (err: any) {
    console.error("[XRPL] Create escrow failed:", err);
    return NextResponse.json(
      { error: `Escrow creation failed: ${err.message}` },
      { status: 500 }
    );
  }
}
