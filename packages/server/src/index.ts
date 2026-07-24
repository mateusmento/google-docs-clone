import { Hono } from "hono";

type Bindings = {
  DB: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>();

app.get("/", (c) => {
  return c.json({ status: "ok" });
});

app.get("/api/documents", (c) => {
  return c.json([]);
});

export default app;
