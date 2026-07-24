import { describe, it, expect, beforeEach } from "vitest";
import { createDocumentsModule } from "../documents";
import { createTestDb } from "./db";
import type { Database } from "../db";

describe("DocumentsModule", () => {
  let db: Database;

  beforeEach(() => {
    db = createTestDb();
  });

  describe("create", () => {
    it("creates a document with valid title", async () => {
      const documents = createDocumentsModule(db);
      const doc = await documents.create("user-1", "My Document");

      expect(doc).toMatchObject({
        title: "My Document",
        ownerId: "user-1",
      });
      expect(doc.id).toBeDefined();
      expect(doc.createdAt).toBeDefined();
      expect(doc.updatedAt).toBeDefined();
    });

    it("throws ValidationError for empty title", async () => {
      const documents = createDocumentsModule(db);

      await expect(documents.create("user-1", "")).rejects.toThrow(
        "Title is required"
      );
    });

    it("throws ValidationError for title over 255 characters", async () => {
      const documents = createDocumentsModule(db);
      const longTitle = "a".repeat(256);

      await expect(documents.create("user-1", longTitle)).rejects.toThrow(
        "Title must be 255 characters or less"
      );
    });

    it("trims whitespace from title", async () => {
      const documents = createDocumentsModule(db);
      const doc = await documents.create("user-1", "  My Document  ");

      expect(doc.title).toBe("My Document");
    });
  });

  describe("list", () => {
    it("returns owned documents", async () => {
      const documents = createDocumentsModule(db);
      await documents.create("user-1", "Doc 1");
      await documents.create("user-1", "Doc 2");

      const docs = await documents.list("user-1");
      expect(docs).toHaveLength(2);
    });

    it("returns empty array for user with no documents", async () => {
      const documents = createDocumentsModule(db);
      const docs = await documents.list("user-1");
      expect(docs).toHaveLength(0);
    });

    it("returns documents sorted by updatedAt descending", async () => {
      const documents = createDocumentsModule(db);
      await documents.create("user-1", "Doc 1");
      
      // Ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 10));
      
      await documents.create("user-1", "Doc 2");

      const docs = await documents.list("user-1");
      expect(docs).toHaveLength(2);
      expect(docs[0].title).toBe("Doc 2");
      expect(docs[1].title).toBe("Doc 1");
    });
  });

  describe("update", () => {
    it("updates document title for owner", async () => {
      const documents = createDocumentsModule(db);
      const doc = await documents.create("user-1", "Original Title");
      
      // Ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 10));

      const updated = await documents.update(doc.id, "user-1", {
        title: "Updated Title",
      });

      expect(updated.title).toBe("Updated Title");
      expect(updated.updatedAt).toBeGreaterThan(doc.updatedAt);
    });

    it("throws NotFoundError for non-existent document", async () => {
      const documents = createDocumentsModule(db);

      await expect(
        documents.update("non-existent", "user-1", { title: "New Title" })
      ).rejects.toThrow("Document not found: non-existent");
    });

    it("throws ForbiddenError for non-owner without edit share", async () => {
      const documents = createDocumentsModule(db);
      const doc = await documents.create("user-1", "Original Title");

      await expect(
        documents.update(doc.id, "user-2", { title: "New Title" })
      ).rejects.toThrow("You do not have permission to edit this document");
    });

    it("throws ValidationError for empty title", async () => {
      const documents = createDocumentsModule(db);
      const doc = await documents.create("user-1", "Original Title");

      await expect(
        documents.update(doc.id, "user-1", { title: "" })
      ).rejects.toThrow("Title is required");
    });
  });

  describe("delete", () => {
    it("deletes document for owner", async () => {
      const documents = createDocumentsModule(db);
      const doc = await documents.create("user-1", "To Delete");

      await documents.delete(doc.id, "user-1");

      const docs = await documents.list("user-1");
      expect(docs).toHaveLength(0);
    });

    it("throws NotFoundError for non-existent document", async () => {
      const documents = createDocumentsModule(db);

      await expect(
        documents.delete("non-existent", "user-1")
      ).rejects.toThrow("Document not found: non-existent");
    });

    it("throws ForbiddenError for non-owner", async () => {
      const documents = createDocumentsModule(db);
      const doc = await documents.create("user-1", "Protected Doc");

      await expect(documents.delete(doc.id, "user-2")).rejects.toThrow(
        "Only the owner can delete a document"
      );
    });
  });
});
