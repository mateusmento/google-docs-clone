import type { Document } from "@google-docs-clone/types";
import { request } from "./client";

export function listDocuments(): Promise<Document[]> {
  return request<Document[]>("/documents");
}

export function createDocument(title: string): Promise<Document> {
  return request<Document>("/documents", {
    method: "POST",
    body: JSON.stringify({ title }),
  });
}

export function updateDocument(
  id: string,
  data: { title: string }
): Promise<Document> {
  return request<Document>(`/documents/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function deleteDocument(id: string): Promise<void> {
  return request<void>(`/documents/${id}`, { method: "DELETE" });
}
