import { Hono } from "hono";
import type { DocumentsModule } from "../documents";

type Variables = {
  user: Record<string, unknown> | null;
  session: Record<string, unknown> | null;
};

export function documentRoutes(documents: DocumentsModule) {
  const app = new Hono<{ Variables: Variables }>();

  app.get("/", async (c) => {
    const user = c.get("user") as { id: string } | null;
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const docs = await documents.list(user.id);
    return c.json(docs);
  });

  app.post("/", async (c) => {
    const user = c.get("user") as { id: string } | null;
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const body = await c.req.json();
    const doc = await documents.create(user.id, body.title);
    return c.json(doc, 201);
  });

  app.patch("/:id", async (c) => {
    const user = c.get("user") as { id: string } | null;
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const documentId = c.req.param("id");
    const body = await c.req.json();
    const doc = await documents.update(documentId, user.id, { title: body.title });
    return c.json(doc);
  });

  app.delete("/:id", async (c) => {
    const user = c.get("user") as { id: string } | null;
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const documentId = c.req.param("id");
    await documents.delete(documentId, user.id);
    return c.body(null, 204);
  });

  return app;
}
