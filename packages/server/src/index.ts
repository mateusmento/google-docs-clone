import { Hono } from "hono";
import { cors } from "hono/cors";
import { createDb } from "./db";
import { createAuth, type Auth } from "./auth";
import { createDocumentsModule, type DocumentsModule } from "./documents";
import { createSharesModule, type SharesModule } from "./shares";
import { errorHandler } from "./middleware/error-handler";

type Bindings = {
  DB: D1Database;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
};

type Variables = {
  auth: Auth;
  user: Record<string, unknown> | null;
  session: Record<string, unknown> | null;
};

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

app.use("*", async (c, next) => {
  const auth = createAuth(c.env.DB, c.env);
  c.set("auth", auth);
  await next();
});

app.use(
  "/api/auth/*",
  cors({
    origin: "http://localhost:5173",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["POST", "GET", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
    credentials: true,
  })
);

app.on(["POST", "GET"], "/api/auth/**", async (c) => {
  const auth = c.get("auth");
  return auth.handler(c.req.raw);
});

app.use("*", async (c, next) => {
  const auth = c.get("auth");
  const session = await auth.api.getSession({ headers: c.req.raw.headers });

  c.set("user", session?.user ?? null);
  c.set("session", session?.session ?? null);
  await next();
});

app.use("/api/*", errorHandler);

app.get("/", (c) => {
  return c.json({ status: "ok" });
});

app.get("/api/documents", async (c) => {
  const db = createDb(c.env.DB);
  const documents = createDocumentsModule(db);
  const user = c.get("user") as { id: string } | null;
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  const docs = await documents.list(user.id);
  return c.json(docs);
});

app.post("/api/documents", async (c) => {
  const db = createDb(c.env.DB);
  const documents = createDocumentsModule(db);
  const user = c.get("user") as { id: string } | null;
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  const body = await c.req.json();
  const doc = await documents.create(user.id, body.title);
  return c.json(doc, 201);
});

app.patch("/api/documents/:id", async (c) => {
  const db = createDb(c.env.DB);
  const documents = createDocumentsModule(db);
  const user = c.get("user") as { id: string } | null;
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  const documentId = c.req.param("id");
  const body = await c.req.json();
  const doc = await documents.update(documentId, user.id, { title: body.title });
  return c.json(doc);
});

app.delete("/api/documents/:id", async (c) => {
  const db = createDb(c.env.DB);
  const documents = createDocumentsModule(db);
  const user = c.get("user") as { id: string } | null;
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  const documentId = c.req.param("id");
  await documents.delete(documentId, user.id);
  return c.body(null, 204);
});

app.get("/api/documents/:documentId/shares", async (c) => {
  const db = createDb(c.env.DB);
  const shares = createSharesModule(db);
  const user = c.get("user") as { id: string } | null;
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  const documentId = c.req.param("documentId");
  const sharesList = await shares.list(documentId, user.id);
  return c.json(sharesList);
});

app.post("/api/documents/:documentId/shares", async (c) => {
  const db = createDb(c.env.DB);
  const shares = createSharesModule(db);
  const user = c.get("user") as { id: string } | null;
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  const documentId = c.req.param("documentId");
  const body = await c.req.json();
  const share = await shares.add(
    documentId,
    user.id,
    body.userId,
    body.permission
  );
  return c.json(share, 201);
});

app.delete("/api/documents/:documentId/shares/:userId", async (c) => {
  const db = createDb(c.env.DB);
  const shares = createSharesModule(db);
  const user = c.get("user") as { id: string } | null;
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  const documentId = c.req.param("documentId");
  const targetUserId = c.req.param("userId");
  await shares.remove(documentId, user.id, targetUserId);
  return c.body(null, 204);
});

export type AppType = typeof app;
export default app;
