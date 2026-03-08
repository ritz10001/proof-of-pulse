import { Hono } from "hono";

const app = new Hono();

// Placeholder — vault operations for key management
app.get("/status", (c) => {
  return c.json({
    oracleConfigured: !!process.env.ORACLE_PRIVATE_KEY,
    xrplConfigured: !!process.env.XRPL_ESCROW_WALLET_SEED,
    pinataConfigured: !!process.env.PINATA_JWT,
    telegramConfigured: !!process.env.TELEGRAM_BOT_TOKEN,
  });
});

export default app;
