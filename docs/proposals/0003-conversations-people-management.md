# 0003 — Conversations & People Management

**Date:** 2026-05-21
**Status:** Accepted
**Author:** Architect
**Feature:** docs/features/0003-conversations-people-management.md

---

## Problem / Motivation

Conversations are the core input to Converser's pipeline. Users need to import conversations from Google Drive, store them as Markdown, organise them by Person/Client, and view them before running agents. Multi-tab Google Docs must be split into sections.

---

## Proposed Solution

Three new backend modules (`people`, `conversations`, `google-drive`) plus frontend pages. Conversations are imported via Google Drive Picker (frontend SDK) → backend fetches content via Google Docs API → converts to Markdown → stores as sections. People are simple user-scoped CRUD.

### Database Schema

**`people` table**

| Column | Type | Notes |
|---|---|---|
| `id` | uuid (PK) | Generated |
| `user_id` | uuid (FK → users.id) | Owner |
| `name` | varchar(255) | Required |
| `description` | text, nullable | |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

**`conversations` table**

| Column | Type | Notes |
|---|---|---|
| `id` | uuid (PK) | Generated |
| `user_id` | uuid (FK → users.id) | Owner |
| `person_id` | uuid (FK → people.id), nullable | Optional link |
| `title` | varchar(255) | From doc title |
| `source_type` | varchar(50), default 'google_docs' | |
| `source_id` | varchar(255), nullable | Google Doc ID |
| `source_url` | text, nullable | Link back to source |
| `imported_at` | timestamptz | |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

**`conversation_sections` table**

| Column | Type | Notes |
|---|---|---|
| `id` | uuid (PK) | Generated |
| `conversation_id` | uuid (FK → conversations.id) | Parent |
| `title` | varchar(255) | Tab name or "Main" |
| `content` | text | Markdown content |
| `order` | integer | Display order |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

### API Endpoints

**People**

| Method | Path | Description |
|---|---|---|
| GET | `/people` | List user's people |
| GET | `/people/:id` | Get single person |
| POST | `/people` | Create person |
| PATCH | `/people/:id` | Update person |
| DELETE | `/people/:id` | Delete person |

**Conversations**

| Method | Path | Description |
|---|---|---|
| GET | `/conversations` | List user's conversations (with person name) |
| GET | `/conversations/:id` | Get conversation with sections |
| POST | `/conversations/import` | Import from Google Drive |
| DELETE | `/conversations/:id` | Delete conversation + sections |

**Import DTO:** `{ documentId: string, personId?: string }`

### Import Flow

```
Frontend: Google Drive Picker → user selects doc → gets document ID
Frontend: POST /conversations/import { documentId, personId? }
Backend:
  1. Decrypt user's Google access token from DB
  2. Call Google Docs API: GET /documents/{id} (includes tab info)
  3. For each tab: export as text/markdown via Docs API
  4. Create Conversation record with title from doc metadata
  5. Create ConversationSection for each tab (title = tab name, content = markdown)
  6. Return created conversation
```

### Google Docs API Integration

- **Authentication:** User's stored Google access token (encrypted in `users.google_access_token_enc`)
- **Endpoint:** `https://docs.googleapis.com/v1/documents/{documentId}` — returns document structure including tabs
- **Export:** `https://www.googleapis.com/drive/v3/files/{documentId}/export?mimeType=text/plain` for single-tab docs, or process each tab's content from the document structure
- **Tab support:** Google Docs API v1 returns `tabs[]` in the document response when `includeTabsContent=true`
- **Markdown conversion:** Google Drive export supports `text/plain`. For richer conversion, parse the Docs JSON structure. Start with plain text export — upgrade to structured markdown parsing later if needed.

### Google Drive Picker (Frontend)

- Load Google Picker API: `https://apis.google.com/js/api.js`
- Configure with user's Google access token (obtained from backend or stored in memory from auth flow)
- Restrict to: `google.picker.ViewId.DOCUMENTS` (Google Docs) and MIME types `application/vnd.google-apps.document`, `text/plain`
- On selection: extract `doc.id`, call backend import endpoint

### Frontend Pages

| Route | Purpose |
|---|---|
| `/people` | List people with create/edit/delete |
| `/people/new` | Create person form |
| `/people/[id]` | Edit person form |
| `/conversations` | List conversations with Import button |
| `/conversations/[id]` | View conversation sections (tab UI + CodeMirror) |

### Sidebar Updates

Add "Conversations" and "People" to the left navigation.

---

## Acceptance Criteria

1. Import button opens Google Drive Picker restricted to docs/text
2. Selected Google Doc is fetched, converted to markdown, stored as Conversation + Sections
3. Multi-tab docs produce multiple sections within one Conversation
4. Conversation list shows title, source, person, date
5. Conversation view shows sections with tab navigation in CodeMirror
6. Conversation delete removes conversation and all sections
7. People CRUD: list, create, edit, delete
8. Conversations can optionally link to a Person at import time
9. User isolation on all entities
10. Seed agents are unaffected

---

## Key Design Decisions

1. **Google Docs API for content, not Drive export** — Docs API provides tab-level access; Drive export only gives the full document as one blob
2. **Plain text export initially** — Start with text/plain from Google, upgrade to structured markdown parsing later. Good enough for 1-1 meeting notes.
3. **Sections as separate table** — Normalised storage allows per-section operations, ordering, and future features (per-section agent runs)
4. **Person is optional on import** — User can link later or leave unlinked; import shouldn't block on missing Person
5. **Google access token from DB** — Reuse the encrypted token stored during OAuth; refresh if expired via Google refresh token
6. **Frontend loads Picker SDK** — Google's Picker is a client-side-only library; backend just receives the document ID

---

## Alternatives Considered

| Alternative | Why rejected |
|---|---|
| Backend fetches file list from Drive API | Slower UX; Picker is purpose-built and handles permissions/search |
| Store raw Google Docs JSON | Not useful for display; markdown is the canonical format for agent consumption |
| One conversation per tab | Loses the logical grouping of a single meeting doc with multiple sections |
| Use Google Drive export (text/plain) for everything | Doesn't give tab-level access; concatenates all tabs into one blob |

---

## Dependencies

### New npm packages (backend)
- `googleapis` — Google APIs client for Docs API calls

### New npm packages (frontend)
- None — Google Picker SDK loaded via script tag

---

## Infrastructure Addendum

No new cloud resources. The existing `GOOGLE_CLIENT_ID` and user's stored Google tokens are sufficient.

---

## Security Considerations

- Conversation content is classified as `confidential` — in production must use customer-managed KMS encryption at rest
- Google access tokens are decrypted only in-memory during import, never logged
- The backend validates the user owns the requested conversation/person before any operation
- Google Picker runs client-side with the user's own token — no server-side file enumeration
- Import is idempotent on `source_id` — re-importing the same doc ID for the same user updates rather than duplicates
