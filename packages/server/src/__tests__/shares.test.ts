import { describe, it, expect, beforeEach } from "vitest";
import { createSharesModule } from "../shares";
import { createDocumentsModule } from "../documents";
import { createTestDb } from "./db";
import type { Database } from "../db";

describe("SharesModule", () => {
  let db: Database;

  beforeEach(() => {
    db = createTestDb();
  });

  describe("add", () => {
    it("creates a share for document owner", async () => {
      const documents = createDocumentsModule(db);
      const shares = createSharesModule(db);

      const doc = await documents.create("user-1", "Shared Doc");
      const share = await shares.add(doc.id, "user-1", "user-2", "view");

      expect(share).toMatchObject({
        documentId: doc.id,
        userId: "user-2",
        permission: "view",
      });
      expect(share.id).toBeDefined();
    });

    it("throws NotFoundError for non-existent document", async () => {
      const shares = createSharesModule(db);

      await expect(
        shares.add("non-existent", "user-1", "user-2", "view")
      ).rejects.toThrow("Document not found: non-existent");
    });

    it("throws ForbiddenError for non-owner", async () => {
      const documents = createDocumentsModule(db);
      const shares = createSharesModule(db);

      const doc = await documents.create("user-1", "Protected Doc");
      await expect(
        shares.add(doc.id, "user-2", "user-3", "view")
      ).rejects.toThrow("Only the owner can share a document");
    });

    it("throws ValidationError for invalid permission", async () => {
      const documents = createDocumentsModule(db);
      const shares = createSharesModule(db);

      const doc = await documents.create("user-1", "Doc");
      await expect(
        shares.add(doc.id, "user-1", "user-2", "invalid" as any)
      ).rejects.toThrow("Permission must be 'view', 'comment', or 'edit'");
    });

    it("updates existing share permission", async () => {
      const documents = createDocumentsModule(db);
      const shares = createSharesModule(db);

      const doc = await documents.create("user-1", "Doc");
      await shares.add(doc.id, "user-1", "user-2", "view");
      const updated = await shares.add(doc.id, "user-1", "user-2", "edit");

      expect(updated.permission).toBe("edit");
    });
  });

  describe("list", () => {
    it("returns shares for document owner", async () => {
      const documents = createDocumentsModule(db);
      const shares = createSharesModule(db);

      const doc = await documents.create("user-1", "Doc");
      await shares.add(doc.id, "user-1", "user-2", "view");
      await shares.add(doc.id, "user-1", "user-3", "edit");

      const sharesList = await shares.list(doc.id, "user-1");
      expect(sharesList).toHaveLength(2);
    });

    it("returns shares for shared user", async () => {
      const documents = createDocumentsModule(db);
      const shares = createSharesModule(db);

      const doc = await documents.create("user-1", "Doc");
      await shares.add(doc.id, "user-1", "user-2", "view");

      const sharesList = await shares.list(doc.id, "user-2");
      expect(sharesList).toHaveLength(1);
    });

    it("throws NotFoundError for non-existent document", async () => {
      const shares = createSharesModule(db);

      await expect(shares.list("non-existent", "user-1")).rejects.toThrow(
        "Document not found: non-existent"
      );
    });

    it("throws ForbiddenError for user without access", async () => {
      const documents = createDocumentsModule(db);
      const shares = createSharesModule(db);

      const doc = await documents.create("user-1", "Doc");
      await expect(shares.list(doc.id, "user-3")).rejects.toThrow(
        "You do not have access to this document"
      );
    });
  });

  describe("remove", () => {
    it("removes a share for document owner", async () => {
      const documents = createDocumentsModule(db);
      const shares = createSharesModule(db);

      const doc = await documents.create("user-1", "Doc");
      await shares.add(doc.id, "user-1", "user-2", "view");

      await shares.remove(doc.id, "user-1", "user-2");

      const sharesList = await shares.list(doc.id, "user-1");
      expect(sharesList).toHaveLength(0);
    });

    it("throws NotFoundError for non-existent document", async () => {
      const shares = createSharesModule(db);

      await expect(
        shares.remove("non-existent", "user-1", "user-2")
      ).rejects.toThrow("Document not found: non-existent");
    });

    it("throws ForbiddenError for non-owner", async () => {
      const documents = createDocumentsModule(db);
      const shares = createSharesModule(db);

      const doc = await documents.create("user-1", "Doc");
      await shares.add(doc.id, "user-1", "user-2", "view");

      await expect(
        shares.remove(doc.id, "user-2", "user-2")
      ).rejects.toThrow("Only the owner can remove shares");
    });

    it("throws NotFoundError for non-existent share", async () => {
      const documents = createDocumentsModule(db);
      const shares = createSharesModule(db);

      const doc = await documents.create("user-1", "Doc");
      await expect(
        shares.remove(doc.id, "user-1", "user-2")
      ).rejects.toThrow("Share not found:");
    });
  });
});
