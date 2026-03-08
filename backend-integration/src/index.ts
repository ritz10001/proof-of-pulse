import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { cors } from "hono/cors";
import dotenv from "dotenv";

// Load environment variables from .env file (only needed for local development)
if (process.env.NODE_ENV !== "production") {
  dotenv.config({ path: ".env.development.local" });
}

// Import routes
import agentAccount from "./routes/agentAccount.js";
import agentInfo from "./routes/agentInfo.js";
import analyze from "./routes/analyze.js";
import attest from "./routes/attest.js";
import pendingRequests from "./routes/pendingRequests.js";
import contractViews from "./routes/contract-views.js";
import vault from "./routes/vault.js";
import telegram from "./routes/telegram.js";
import { startTelegramBot } from "./telegram/bot.js";

const app = new Hono();

// Configure CORS
app.use(cors());

// Health check
app.get("/", (c) =>
  c.json({ message: "Proof of Pulse Shade Agent is running" })
);

// Routes
app.route("/api/agent-account", agentAccount);
app.route("/api/agent-info", agentInfo);
app.route("/api/analyze", analyze);
app.route("/api/attest", attest);
app.route("/api/pending-requests", pendingRequests);
app.route("/api", contractViews);
app.route("/api/vault", vault);
app.route("/api/telegram", telegram);

// Start the server
const port = Number(process.env.PORT || "3001");

console.log(`Proof of Pulse Shade Agent running on http://localhost:${port}`);

serve({ fetch: app.fetch, port });

// ── Start Telegram bot (long-polling mode) ──
startTelegramBot();

// ── Background polling disabled (XRP Ledger doesn't need polling) ──
// XRP Ledger transactions are immediate, no async fulfillment needed
console.log("[Shade Agent] XRP Ledger mode - no polling required");
