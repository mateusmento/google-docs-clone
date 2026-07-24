import { Hono } from "hono";
import { createDb } from "./db";

type Bindings = {
  DB: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>();

app.get("/", (c) => {
  return c.json({ status: "ok" });
});

app.get("/api/documents", async (c) => {
  const db = createDb(c.env.DB);
  const documents = await db.query.document.findMany();
  return c.json(documents);
});

export default app;
