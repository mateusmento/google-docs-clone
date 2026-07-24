export interface User {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Document {
  id: string;
  title: string;
  ownerId: string;
  createdAt: number;
  updatedAt: number;
}

export type Permission = "view" | "comment" | "edit";

export interface DocumentShare {
  id: string;
  documentId: string;
  userId: string;
  permission: Permission;
  createdAt: number;
}
