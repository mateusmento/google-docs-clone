import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import type { Database } from "../db";
import * as schema from "../db/schema";
import type { Permission } from "@google-docs-clone/types";
import { NotFoundError, ForbiddenError, ValidationError } from "../errors";

export interface Document {
  id: string;
  title: string;
  ownerId: string;
  createdAt: number;
  updatedAt: number;
}

export interface DocumentsModule {
  list(userId: string): Promise<Document[]>;
  create(userId: string, title: string): Promise<Document>;
  update(
    documentId: string,
    userId: string,
    data: { title: string }
  ): Promise<Document>;
  delete(documentId: string, userId: string): Promise<void>;
}

export function createDocumentsModule(db: Database): DocumentsModule {
  async function list(userId: string): Promise<Document[]> {
    const ownedDocs = await db.query.document.findMany({
      where: eq(schema.document.ownerId, userId),
    });

    const sharedDocs = await db.query.documentShare.findMany({
      where: eq(schema.documentShare.userId, userId),
      with: {
        document: true,
      },
    });

    const sharedDocuments = sharedDocs.map((share) => share.document);

    const allDocs = [...ownedDocs, ...sharedDocuments];
    const uniqueDocs = allDocs.filter(
      (doc, index, self) => index === self.findIndex((d) => d.id === doc.id)
    );

    return uniqueDocs.sort((a, b) => b.updatedAt - a.updatedAt);
  }

  async function create(userId: string, title: string): Promise<Document> {
    if (!title || title.trim().length === 0) {
      throw new ValidationError("Title is required");
    }

    if (title.length > 255) {
      throw new ValidationError("Title must be 255 characters or less");
    }

    const now = Date.now();
    const doc = {
      id: nanoid(),
      title: title.trim(),
      ownerId: userId,
      createdAt: now,
      updatedAt: now,
    };

    await db.insert(schema.document).values(doc);

    return doc;
  }

  async function update(
    documentId: string,
    userId: string,
    data: { title: string }
  ): Promise<Document> {
    if (!data.title || data.title.trim().length === 0) {
      throw new ValidationError("Title is required");
    }

    if (data.title.length > 255) {
      throw new ValidationError("Title must be 255 characters or less");
    }

    const doc = await db.query.document.findFirst({
      where: eq(schema.document.id, documentId),
    });

    if (!doc) {
      throw new NotFoundError("Document", documentId);
    }

    const hasAccess = await canAccess(documentId, userId, "edit");
    if (!hasAccess) {
      throw new ForbiddenError("You do not have permission to edit this document");
    }

    const now = Date.now();
    await db
      .update(schema.document)
      .set({ title: data.title.trim(), updatedAt: now })
      .where(eq(schema.document.id, documentId));

    return { ...doc, title: data.title.trim(), updatedAt: now };
  }

  async function deleteDocument(documentId: string, userId: string): Promise<void> {
    const doc = await db.query.document.findFirst({
      where: eq(schema.document.id, documentId),
    });

    if (!doc) {
      throw new NotFoundError("Document", documentId);
    }

    if (doc.ownerId !== userId) {
      throw new ForbiddenError("Only the owner can delete a document");
    }

    await db
      .delete(schema.document)
      .where(eq(schema.document.id, documentId));
  }

  async function canAccess(
    documentId: string,
    userId: string,
    requiredPermission?: Permission
  ): Promise<boolean> {
    const doc = await db.query.document.findFirst({
      where: eq(schema.document.id, documentId),
    });

    if (doc?.ownerId === userId) {
      return true;
    }

    if (!requiredPermission || requiredPermission === "view") {
      const share = await db.query.documentShare.findFirst({
        where: and(
          eq(schema.documentShare.documentId, documentId),
          eq(schema.documentShare.userId, userId)
        ),
      });
      return !!share;
    }

    const share = await db.query.documentShare.findFirst({
      where: and(
        eq(schema.documentShare.documentId, documentId),
        eq(schema.documentShare.userId, userId),
        eq(schema.documentShare.permission, requiredPermission)
      ),
    });

    return !!share;
  }

  return { list, create, update, delete: deleteDocument };
}
