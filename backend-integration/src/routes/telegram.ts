import { Hono } from "hono";

const app = new Hono();

// Telegram bot runs in long-polling mode (started from index.ts)
// This route is a placeholder for future webhook mode
app.get("/health", (c) => c.json({ status: "ok", mode: "polling" }));

export default app;
