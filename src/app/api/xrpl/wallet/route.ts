import { NextResponse } from "next/server";
import { fundEscrowWallet, getEscrowBalance } from "@/lib/xrpl/escrow";

export async function GET() {
  try {
    const info = await getEscrowBalance();
    return NextResponse.json(info);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST() {
  try {
    const result = await fundEscrowWallet();
    return NextResponse.json({ success: true, ...result });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
