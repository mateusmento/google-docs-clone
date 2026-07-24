import type { DocumentShare } from "@google-docs-clone/types";
import { request } from "./client";

export function listShares(documentId: string): Promise<DocumentShare[]> {
  return request<DocumentShare[]>(`/documents/${documentId}/shares`);
}

export function addShare(
  documentId: string,
  userId: string,
  permission: string
): Promise<DocumentShare> {
  return request<DocumentShare>(`/documents/${documentId}/share`, {
    method: "POST",
    body: JSON.stringify({ userId, permission }),
  });
}

export function removeShare(documentId: string, userId: string): Promise<void> {
  return request<void>(`/documents/${documentId}/share/${userId}`, {
    method: "DELETE",
  });
}
