import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import type { Database } from "../db";
import * as schema from "../db/schema";
import type { Permission } from "@google-docs-clone/types";
import { NotFoundError, ForbiddenError, ValidationError } from "../errors";

export interface Share {
  id: string;
  documentId: string;
  userId: string;
  permission: Permission;
  createdAt: number;
}

export interface SharesModule {
  list(documentId: string, userId: string): Promise<Share[]>;
  add(
    documentId: string,
    ownerUserId: string,
    targetUserId: string,
    permission: Permission
  ): Promise<Share>;
  remove(documentId: string, ownerUserId: string, targetUserId: string): Promise<void>;
}

export function createSharesModule(db: Database): SharesModule {
  async function list(documentId: string, userId: string): Promise<Share[]> {
    const doc = await db.query.document.findFirst({
      where: eq(schema.document.id, documentId),
    });

    if (!doc) {
      throw new NotFoundError("Document", documentId);
    }

    const hasAccess = await canAccessDocument(documentId, userId);
    if (!hasAccess) {
      throw new ForbiddenError("You do not have access to this document");
    }

    const shares = await db.query.documentShare.findMany({
      where: eq(schema.documentShare.documentId, documentId),
    });

    return shares;
  }

  async function add(
    documentId: string,
    ownerUserId: string,
    targetUserId: string,
    permission: Permission
  ): Promise<Share> {
    const doc = await db.query.document.findFirst({
      where: eq(schema.document.id, documentId),
    });

    if (!doc) {
      throw new NotFoundError("Document", documentId);
    }

    if (doc.ownerId !== ownerUserId) {
      throw new ForbiddenError("Only the owner can share a document");
    }

    if (!isValidPermission(permission)) {
      throw new ValidationError("Permission must be 'view', 'comment', or 'edit'");
    }

    const existingShare = await db.query.documentShare.findFirst({
      where: and(
        eq(schema.documentShare.documentId, documentId),
        eq(schema.documentShare.userId, targetUserId)
      ),
    });

    if (existingShare) {
      await db
        .update(schema.documentShare)
        .set({ permission })
        .where(eq(schema.documentShare.id, existingShare.id));

      return {
        ...existingShare,
        permission,
      };
    }

    const now = Date.now();
    const share = {
      id: nanoid(),
      documentId,
      userId: targetUserId,
      permission,
      createdAt: now,
    };

    await db.insert(schema.documentShare).values(share);

    return share;
  }

  async function remove(
    documentId: string,
    ownerUserId: string,
    targetUserId: string
  ): Promise<void> {
    const doc = await db.query.document.findFirst({
      where: eq(schema.document.id, documentId),
    });

    if (!doc) {
      throw new NotFoundError("Document", documentId);
    }

    if (doc.ownerId !== ownerUserId) {
      throw new ForbiddenError("Only the owner can remove shares");
    }

    const share = await db.query.documentShare.findFirst({
      where: and(
        eq(schema.documentShare.documentId, documentId),
        eq(schema.documentShare.userId, targetUserId)
      ),
    });

    if (!share) {
      throw new NotFoundError("Share", `${documentId}:${targetUserId}`);
    }

    await db
      .delete(schema.documentShare)
      .where(eq(schema.documentShare.id, share.id));
  }

  async function canAccessDocument(
    documentId: string,
    userId: string
  ): Promise<boolean> {
    const doc = await db.query.document.findFirst({
      where: eq(schema.document.id, documentId),
    });

    if (doc?.ownerId === userId) {
      return true;
    }

    const share = await db.query.documentShare.findFirst({
      where: and(
        eq(schema.documentShare.documentId, documentId),
        eq(schema.documentShare.userId, userId)
      ),
    });

    return !!share;
  }

  function isValidPermission(permission: string): permission is Permission {
    return ["view", "comment", "edit"].includes(permission);
  }

  return { list, add, remove };
}
