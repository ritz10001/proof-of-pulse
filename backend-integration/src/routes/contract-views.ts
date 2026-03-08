import { Hono } from "hono";
import { ethers } from "ethers";

const RPC_URL = process.env.NEXT_PUBLIC_XRP_EVM_RPC_URL || "https://rpc.testnet.xrplevm.org";

const app = new Hono();

app.get("/contracts", (c) => {
  return c.json({
    proofOfPulse: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "",
    insuranceDAO: process.env.NEXT_PUBLIC_INSURANCE_DAO_ADDRESS || "",
    challengeDAO: process.env.NEXT_PUBLIC_DAO_CONTRACT_ADDRESS || "",
    rpcUrl: RPC_URL,
    chainId: 1449000,
  });
});

app.get("/balance/:address", async (c) => {
  const address = c.req.param("address");
  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const balance = await provider.getBalance(address);
    return c.json({ address, balance: ethers.formatEther(balance) });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

export default app;
