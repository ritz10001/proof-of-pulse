import { Client, Wallet, xrpToDrops, EscrowCreate, EscrowFinish } from "xrpl";

const XRPL_DEVNET_URL = "wss://s.devnet.rippletest.net:51233";

// Server-side escrow wallet — funded via Devnet faucet
// In production, this would be a multisig or custody solution
let escrowWallet: Wallet | null = null;

function getEscrowWallet(): Wallet {
  const seed = process.env.XRPL_ESCROW_WALLET_SEED;
  if (seed) {
    return Wallet.fromSeed(seed);
  }
  // Generate deterministically from the EVM private key for demo consistency
  const evmKey = process.env.ORACLE_PRIVATE_KEY;
  if (evmKey) {
    const hexStr = evmKey.replace("0x", "").slice(0, 32);
    const bytes = new Uint8Array(hexStr.length / 2);
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = parseInt(hexStr.slice(i * 2, i * 2 + 2), 16);
    }
    return Wallet.fromEntropy(bytes);
  }
  throw new Error("No XRPL wallet seed configured");
}

async function withClient<T>(fn: (client: Client) => Promise<T>): Promise<T> {
  const client = new Client(XRPL_DEVNET_URL);
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.disconnect();
  }
}

/**
 * Fund the escrow wallet from the XRPL Devnet faucet (for demo).
 */
export async function fundEscrowWallet(): Promise<{ address: string; balance: string }> {
  return withClient(async (client) => {
    const wallet = getEscrowWallet();
    // Try to get balance first
    try {
      const balance = await client.getXrpBalance(wallet.address);
      if (parseFloat(String(balance)) > 100) {
        return { address: wallet.address, balance: String(balance) };
      }
    } catch {
      // Account doesn't exist yet, fund it
    }
    // Fund from faucet
    await client.fundWallet(wallet);
    const balance = await client.getXrpBalance(wallet.address);
    return { address: wallet.address, balance: String(balance) };
  });
}

/**
 * Create an XRPL escrow that locks XRP until a condition is met or time expires.
 * For the demo: time-based escrow that can be finished after DAO approval.
 */
export async function createEscrow(params: {
  amountXrp: string;
  destinationAddress: string;
  finishAfterSeconds?: number; // minimum hold time (default: 60s for demo)
  cancelAfterSeconds?: number; // auto-cancel time (default: 24h)
}): Promise<{
  txHash: string;
  escrowSequence: number;
  sourceAddress: string;
  destinationAddress: string;
  amountXrp: string;
  finishAfter: string;
  cancelAfter: string;
}> {
  return withClient(async (client) => {
    const wallet = getEscrowWallet();

    // Check balance
    const balance = await client.getXrpBalance(wallet.address);
    const needed = parseFloat(params.amountXrp) + 12; // 12 XRP reserve buffer
    if (parseFloat(String(balance)) < needed) {
      throw new Error(`Insufficient XRPL balance: ${balance} XRP (need ~${needed} XRP)`);
    }

    const now = Math.floor(Date.now() / 1000);
    // XRPL uses Ripple epoch (seconds since Jan 1, 2000 00:00:00 UTC)
    const rippleEpochOffset = 946684800;
    const finishAfterSec = params.finishAfterSeconds ?? 60;
    const cancelAfterSec = params.cancelAfterSeconds ?? 86400;

    const finishAfter = now - rippleEpochOffset + finishAfterSec;
    const cancelAfter = now - rippleEpochOffset + cancelAfterSec;

    const escrowTx: EscrowCreate = {
      TransactionType: "EscrowCreate",
      Account: wallet.address,
      Amount: xrpToDrops(params.amountXrp),
      Destination: params.destinationAddress,
      FinishAfter: finishAfter,
      CancelAfter: cancelAfter,
    };

    const result = await client.submitAndWait(escrowTx, { wallet });

    if (typeof result.result.meta === "string") {
      throw new Error("Transaction meta is a string, cannot parse");
    }

    if (result.result.meta?.TransactionResult !== "tesSUCCESS") {
      throw new Error(`Escrow creation failed: ${result.result.meta?.TransactionResult}`);
    }

    // The escrow sequence is the Sequence from the transaction
    const escrowSequence = (result.result as any).Sequence ?? (result.result.tx_json as any)?.Sequence ?? 0;

    return {
      txHash: result.result.hash,
      escrowSequence,
      sourceAddress: wallet.address,
      destinationAddress: params.destinationAddress,
      amountXrp: params.amountXrp,
      finishAfter: new Date((finishAfter + rippleEpochOffset) * 1000).toISOString(),
      cancelAfter: new Date((cancelAfter + rippleEpochOffset) * 1000).toISOString(),
    };
  });
}

/**
 * Finish (release) an XRPL escrow, sending funds to the destination.
 * Called after DAO approves the submission.
 */
export async function finishEscrow(params: {
  escrowOwner: string;
  escrowSequence: number;
}): Promise<{
  txHash: string;
  success: boolean;
}> {
  return withClient(async (client) => {
    const wallet = getEscrowWallet();

    const finishTx: EscrowFinish = {
      TransactionType: "EscrowFinish",
      Account: wallet.address,
      Owner: params.escrowOwner,
      OfferSequence: params.escrowSequence,
    };

    const result = await client.submitAndWait(finishTx, { wallet });

    if (typeof result.result.meta === "string") {
      throw new Error("Transaction meta is a string, cannot parse");
    }

    const success = result.result.meta?.TransactionResult === "tesSUCCESS";

    return {
      txHash: result.result.hash,
      success,
    };
  });
}

/**
 * Get the escrow wallet address for display.
 */
export function getEscrowWalletAddress(): string {
  return getEscrowWallet().address;
}

/**
 * Check escrow wallet balance.
 */
export async function getEscrowBalance(): Promise<{ address: string; balance: string }> {
  return withClient(async (client) => {
    const wallet = getEscrowWallet();
    try {
      const balance = await client.getXrpBalance(wallet.address);
      return { address: wallet.address, balance: String(balance) };
    } catch {
      return { address: wallet.address, balance: "0" };
    }
  });
}
