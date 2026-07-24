import type { Document, DocumentShare } from "@google-docs-clone/types";

const BASE_URL = "/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error || res.statusText);
  }

  return res.json();
}

function listDocuments(): Promise<Document[]> {
  return request<Document[]>("/documents");
}

function createDocument(title: string): Promise<Document> {
  return request<Document>("/documents", {
    method: "POST",
    body: JSON.stringify({ title }),
  });
}

function updateDocument(
  id: string,
  data: { title: string }
): Promise<Document> {
  return request<Document>(`/documents/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

function deleteDocument(id: string): Promise<void> {
  return request<void>(`/documents/${id}`, { method: "DELETE" });
}

function listShares(documentId: string): Promise<DocumentShare[]> {
  return request<DocumentShare[]>(`/documents/${documentId}/shares`);
}

function addShare(
  documentId: string,
  userId: string,
  permission: string
): Promise<DocumentShare> {
  return request<DocumentShare>(`/documents/${documentId}/share`, {
    method: "POST",
    body: JSON.stringify({ userId, permission }),
  });
}

function removeShare(documentId: string, userId: string): Promise<void> {
  return request<void>(`/documents/${documentId}/share/${userId}`, {
    method: "DELETE",
  });
}

export const api = {
  documents: {
    list: listDocuments,
    create: createDocument,
    update: updateDocument,
    delete: deleteDocument,
  },
  shares: {
    list: listShares,
    add: addShare,
    remove: removeShare,
  },
};
