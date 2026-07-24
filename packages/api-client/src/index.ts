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

export const api = {
  documents: {
    list: () => request<Document[]>("/documents"),
    create: (title: string) =>
      request<Document>("/documents", {
        method: "POST",
        body: JSON.stringify({ title }),
      }),
    update: (id: string, data: { title: string }) =>
      request<Document>(`/documents/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request<void>(`/documents/${id}`, { method: "DELETE" }),
  },
  shares: {
    list: (documentId: string) =>
      request<DocumentShare[]>(`/documents/${documentId}/shares`),
    add: (documentId: string, userId: string, permission: string) =>
      request<DocumentShare>(`/documents/${documentId}/share`, {
        method: "POST",
        body: JSON.stringify({ userId, permission }),
      }),
    remove: (documentId: string, userId: string) =>
      request<void>(`/documents/${documentId}/share/${userId}`, {
        method: "DELETE",
      }),
  },
};
