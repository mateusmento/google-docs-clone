# Google Docs Clone — Architecture Spec

## Problem Statement

Build a collaborative real-time document editor (Google Docs clone) that allows multiple users to create, edit, and share documents simultaneously with live cursor presence, using a fully free-tier deployment stack.

## Solution

A full-stack application deployed entirely on Cloudflare's free tier, using Hocuspocus + Yjs for real-time collaboration, Tiptap for the rich text editor, Hono for the API layer, D1 for persistence, Durable Objects for WebSocket state, and Better Auth for authentication.

## User Stories

### Authentication & Account Management

1. As a user, I want to sign up with my email and password, so that I can create an account
2. As a user, I want to sign up with Google OAuth, so that I can use my existing Google account
3. As a user, I want to log in with my email and password, so that I can access my documents
4. As a user, I want to log in with Google OAuth, so that I can access my documents quickly
5. As a user, I want to log out, so that my session is ended securely
6. As a user, I want to see my profile information, so that I know which account I'm using
7. As a user, I want my session to persist across page reloads, so that I don't have to log in repeatedly

### Document Management

8. As a user, I want to create a new document, so that I can start writing
9. As a user, I want to see a list of all my documents, so that I can find what I need
10. As a user, I want to rename a document, so that I can organize my work
11. As a user, I want to delete a document, so that I can remove unwanted documents
12. As a user, I want to see when a document was last updated, so that I can find recent work
13. As a user, I want to see the owner of each document, so that I know who created it
14. As a user, I want a dashboard/home page showing my documents, so that I can navigate quickly

### Rich Text Editing

15. As a user, I want to write and format text with headings, bold, italic, underline, and strikethrough, so that I can structure my content
16. As a user, I want to create bulleted and numbered lists, so that I can organize information
17. As a user, I want to insert blockquotes, so that I can highlight referenced text
18. As a user, I want to insert code blocks, so that I can share code snippets
19. As a user, I want to insert horizontal rules, so that I can visually separate sections
20. As a user, I want to undo and redo my edits, so that I can correct mistakes
21. As a user, I want to use keyboard shortcuts for common formatting, so that I can work efficiently
22. As a user, I want to see a formatting toolbar, so that I can access formatting options visually
23. As a user, I want a slash command menu, so that I can insert blocks quickly by typing "/"
24. As a user, I want the document title to be editable inline, so that I can rename without a dialog

### Real-Time Collaboration

25. As a user, I want to see other users' cursors in real time, so that I know who is editing where
26. As a user, I want to see other users' selections highlighted, so that I can see what they're working on
27. As a user, I want to see other users' names/avatars next to their cursors, so that I can identify collaborators
28. As a user, I want my edits to appear instantly for all other connected users, so that we stay in sync
29. As a user, I want conflict-free merging of concurrent edits, so that no work is lost
30. As a user, I want to see a "user is typing" or presence indicator, so that I know others are active
31. As a user, I want the document to load the latest state when I open it, so that I see current content
32. As a user, I want edits to be persisted automatically, so that I never lose work

### Sharing & Permissions

33. As a document owner, I want to share a document via a link, so that others can access it
34. As a document owner, I want to set permission levels (view, comment, edit), so that I control access
35. As a document owner, I want to invite specific users by email, so that I can collaborate selectively
36. As a document owner, I want to revoke access for a user, so that I can remove collaborators
37. As a document owner, I want to see who has access to my document, so that I can manage sharing
38. As a viewer, I want to open a shared document in read-only mode, so that I can read without modifying
39. As a commenter, I want to view the document and leave comments (future), so that I can give feedback
40. As a user, I want to see documents shared with me in a separate section, so that I can find collaborative docs

### User Interface

41. As a user, I want a clean, minimal editor interface, so that I can focus on writing
42. As a user, I want the editor to be responsive, so that it works on different screen sizes
43. As a user, I want the document list to show titles, dates, and owners, so that I can scan quickly
44. As a user, I want visual feedback when collaboration is active (e.g., connected indicator), so that I know the sync is working
45. As a user, I want smooth scrolling and typing performance, so that the editor feels native

## Implementation Decisions

### Architecture Overview

- **Monolith** — Single deployable unit. Hono serves the REST API and static frontend. Hocuspocus handles WebSocket collaboration. No microservices.
- **Turborepo monorepo** with four packages under `@google-docs-clone/` scope:
  - `@google-docs-clone/types` — Shared TypeScript types (document schemas, API contracts, permission models)
  - `@google-docs-clone/api-client` — API wrapper classes for HTTP requests from the frontend
  - `@google-docs-clone/web` — React + Vite frontend
  - `@google-docs-clone/server` — Hono backend on Cloudflare Workers

### Runtime & Hosting (All-in Cloudflare)

- **Cloudflare Workers** — Hono API + Hocuspocus collaboration server
- **Cloudflare D1** — SQLite database for users, documents, shares, and Yjs document state
- **Cloudflare Durable Objects** — WebSocket state for Hocuspocus (via `hocuspocus-do` adapter)
- **Cloudflare Pages** — Static hosting for the built React frontend
- **No credit card required** — Entire stack runs on Cloudflare's free tier

### Backend

- **Hono** — Lightweight web framework, first-class Cloudflare Workers support
- **Drizzle ORM** — TypeScript-first ORM with D1 adapter. Schema defined in TypeScript, migrations via Drizzle Kit
- **Better Auth** — TypeScript-first auth framework, native Cloudflare Workers support. Handles Google OAuth, email/password, session management. Uses D1 for session storage.

### Frontend

- **React 18+** with **Vite** — Fast dev server, optimized builds
- **Tiptap** — Headless rich text editor built on ProseMirror. Official Yjs integration via `@hocuspocus/provider`
- **React + Vite** deployed to Cloudflare Pages as static assets

### Real-Time Collaboration

- **Yjs** — CRDT library for conflict-free collaborative editing
- **Hocuspocus v4** — WebSocket collaboration server. Uses `crossws` for cross-runtime support
- **`hocuspocus-do`** — Adapter that bridges Hocuspocus to Cloudflare Durable Objects. Replaces Node.js transport layer with DO-based WebSocket handling
- **One Durable Object per document** — Each open document gets its own DO instance for coordination
- **WebSocket hibernation** — DOs hibernate when idle, wake on new messages without dropping connections

### Database Schema

Core tables (managed via Drizzle + D1):

- **`user`** — Managed by Better Auth. Fields: id, name, email, emailVerified, image, createdAt, updatedAt
- **`session`** — Managed by Better Auth. Fields: id, userId, token, expiresAt, ipAddress, userAgent
- **`account`** — Managed by Better Auth. Fields: id, userId, accountId, providerId, accessToken, refreshToken, etc.
- **`verification`** — Managed by Better Auth. Fields: id, identifier, value, expiresAt, createdAt, updatedAt
- **`document`** — id (text, primary key), title (text), ownerId (references user.id), createdAt (integer), updatedAt (integer)
- **`document_share`** — id (text, primary key), documentId (references document.id), userId (references user.id), permission (text: "view" | "comment" | "edit"), createdAt (integer)
- **`document_state`** — id (text, primary key), documentId (references document.id, unique), state (blob: Yjs binary state). Updated via Hocuspocus `onStoreDocument` hook.

### Document Persistence Flow

1. User connects via WebSocket to the Durable Object for a specific document
2. Hocuspocus loads document state from `document_state` table (if exists) or creates empty Yjs doc
3. Real-time edits are merged via Yjs CRDT in the Durable Object's memory
4. On `onStoreDocument` hook (periodic or on disconnect), Hocuspocus fires with the full Yjs binary state
5. The server writes the binary state to `document_state` table in D1
6. On next connection, the state is loaded and replayed

### API Design

REST endpoints served by Hono on the Workers runtime:

- `POST /api/auth/*` — Better Auth handler (sign up, sign in, sign out, OAuth callbacks)
- `GET /api/documents` — List user's documents (owned + shared)
- `POST /api/documents` — Create new document
- `PATCH /api/documents/:id` — Update document metadata (title)
- `DELETE /api/documents/:id` — Delete document (owner only)
- `POST /api/documents/:id/share` — Share document with user
- `DELETE /api/documents/:id/share/:userId` — Revoke share
- `GET /api/documents/:id/shares` — List shares for a document
- WebSocket endpoint — Handled by Hocuspocus via Durable Object routing

### Frontend Architecture

- **State management** — React hooks + context. Tiptap editor state managed by Tiptap internally. Document list state via React Query or similar.
- **Routing** — React Router or TanStack Router. Routes: `/` (dashboard), `/doc/:id` (editor), `/login`, `/signup`
- **API client** — `@google-docs-clone/api-client` package wraps fetch calls with auth headers. Used by the web package.

## Testing Decisions

### What Makes a Good Test

- Test external behavior (API responses, UI rendering, collaboration sync), not internal implementation
- Integration tests over unit tests where possible — test the full request/response cycle
- Collaboration tests should verify that two connected clients see each other's edits

### Modules to Test

- **API endpoints** — Test each REST endpoint with mock D1 data. Verify auth middleware blocks unauthenticated requests.
- **Better Auth flows** — Test sign up, sign in, OAuth mock, session validation
- **Document CRUD** — Test create, read, update, delete, share operations
- **Collaboration** — Test WebSocket connection, edit sync between two clients, document persistence after disconnect
- **Frontend** — Test document list rendering, editor initialization, share dialog

### Prior Art

- No existing tests (greenfield project). Testing framework to be determined — Vitest is recommended for consistency with Vite.

## Out of Scope

- Comments/commenting system (future feature)
- Version history / revision tracking
- Offline mode / local persistence
- File/image uploads
- Export to PDF/DOCX
- Mobile-native apps
- Real-time chat within documents
- Document templates
- Search functionality
- Analytics or audit logging
- Multi-language / i18n
- Custom themes / dark mode (can be added later)

## Further Notes

- The entire stack is designed to run on Cloudflare's free tier with no credit card required
- D1 is SQLite, not PostgreSQL — this affects schema design (no JSON operators, simpler joins, ~50 writes/sec cap)
- Hocuspocus v4 + `hocuspocus-do` is relatively new — monitor for issues with Durable Object hibernation
- Better Auth with D1 adapter is the officially recommended stack for Hono + Cloudflare
- The `@google-docs-clone/api-client` package should be framework-agnostic so it could be reused by a future mobile app

## Decisions Pending

The following decisions were deferred during the architecture grilling session. They are implementation-level details that are better resolved during coding.

### Database Schema

- **Exact column types and constraints** — Which columns are `TEXT NOT NULL`, which have defaults, which use `INTEGER` for timestamps (unix epoch vs ISO string)
- **Indexes** — Which columns need indexes for query performance (e.g., `document.ownerId`, `document_share.documentId`)
- **Document ID format** — UUID, nanoid, or custom slug
- **On delete behavior** — Cascade deletes when a user or document is removed, or soft deletes

### API Response Shapes

- **Error response format** — `{ error: string }`, `{ message: string, code: string }`, or structured error objects
- **Pagination** — Cursor-based or offset-based for document lists
- **Field selection** — Whether clients can request specific fields or always get full objects
- **Timestamp format** — Unix epoch integers, ISO 8601 strings, or both

### Frontend Architecture

- **State management** — React Query/TanStack Query for server state, or custom hooks with context
- **Routing library** — React Router v7 or TanStack Router
- **Styling approach** — Tailwind CSS, CSS modules, or styled-components
- **Component library** — Build from scratch or use a headless UI library (Radix, shadcn/ui)
- **Form handling** — React Hook Form, Formik, or native forms

### Editor Details

- **Tiptap extensions list** — Exact set of extensions to install (StarterKit, Placeholder, CharacterCount, etc.)
- **Toolbar design** — Which buttons, grouped how, responsive behavior
- **Slash command items** — Which blocks are available via slash commands
- **Collaboration cursor colors** — How to assign and display colors for multiple users

### Authentication

- **Session duration** — How long sessions last before expiry
- **Password policy** — Minimum length, complexity requirements
- **Email verification** — Whether to require email verification on sign-up

### Sharing

- **Permission granularity** — Currently view/edit only. Future: comment permission?
- **Share link expiry** — Whether shared links can expire (not in MVP)
- **Maximum shares** — Any limit on how many users a document can be shared with
