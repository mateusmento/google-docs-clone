import { Hono } from "hono";
import type { SharesModule } from "../shares";
import type { Permission } from "@google-docs-clone/types";

type Variables = {
  user: Record<string, unknown> | null;
  session: Record<string, unknown> | null;
};

export function shareRoutes(shares: SharesModule) {
  const app = new Hono<{ Variables: Variables }>();

  app.get("/:documentId/shares", async (c) => {
    const user = c.get("user") as { id: string } | null;
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const documentId = c.req.param("documentId");
    const sharesList = await shares.list(documentId, user.id);
    return c.json(sharesList);
  });

  app.post("/:documentId/shares", async (c) => {
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
      body.permission as Permission
    );
    return c.json(share, 201);
  });

  app.delete("/:documentId/shares/:userId", async (c) => {
    const user = c.get("user") as { id: string } | null;
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const documentId = c.req.param("documentId");
    const targetUserId = c.req.param("userId");
    await shares.remove(documentId, user.id, targetUserId);
    return c.body(null, 204);
  });

  return app;
}
