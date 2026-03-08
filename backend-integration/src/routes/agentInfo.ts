import { Hono } from "hono";

const app = new Hono();

app.get("/", (c) => {
  return c.json({
    name: "Proof of Pulse Agent",
    version: "1.0.0",
    chain: "XRP EVM Sidechain Testnet",
    chainId: 1449000,
    capabilities: ["attest", "analyze", "dao-vote", "telegram-bot"],
  });
});

export default app;
