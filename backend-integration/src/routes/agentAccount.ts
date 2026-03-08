import { Hono } from "hono";
import { ethers } from "ethers";

const app = new Hono();

app.get("/", (c) => {
  const key = process.env.ORACLE_PRIVATE_KEY;
  if (!key) return c.json({ error: "No oracle key configured" }, 500);
  const wallet = new ethers.Wallet(key);
  return c.json({
    address: wallet.address,
    type: "oracle",
  });
});

export default app;
