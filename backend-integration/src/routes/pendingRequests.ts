import { Hono } from "hono";

const app = new Hono();

// Placeholder — returns empty pending list
app.get("/", (c) => {
  return c.json({ pending: [] });
});

export default app;
