# 0002 — Agent & Context Management

**Date:** 2026-05-21
**Status:** Accepted
**Author:** Architect
**Feature:** docs/features/0002-agent-context-management.md

---

## Problem / Motivation

Converser's pipeline requires user-configurable Agents (instruction sets for Bedrock) and Context (background documents). Before building the execution pipeline, users need CRUD management for both. Agent instructions are a settled decision (#8) — they must be user-editable, not hard-coded.

---

## Proposed Solution

Two new NestJS modules (`agents`, `contexts`) with corresponding TypeORM entities, REST APIs, and Next.js frontend pages using CodeMirror for markdown editing. Both are user-scoped — all queries filter by the authenticated user's ID.

### Database Schema

**`agents` table**

| Column | Type | Notes |
|---|---|---|
| `id` | uuid (PK) | Generated |
| `user_id` | uuid (FK → users.id) | Owner |
| `name` | varchar(255) | Required |
| `description` | varchar(500), nullable | Short summary |
| `instructions` | text | Markdown content |
| `is_default` | boolean, default false | True for seed agents |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

**`contexts` table**

| Column | Type | Notes |
|---|---|---|
| `id` | uuid (PK) | Generated |
| `user_id` | uuid (FK → users.id) | Owner |
| `name` | varchar(255) | Required |
| `description` | varchar(500), nullable | Short summary |
| `content` | text | Markdown content |
| `source_type` | varchar(50), default 'manual' | For future expansion (confluence, etc.) |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

### API Endpoints

**Agents**

| Method | Path | Description |
|---|---|---|
| GET | `/agents` | List user's agents |
| GET | `/agents/:id` | Get single agent |
| POST | `/agents` | Create agent |
| PATCH | `/agents/:id` | Update agent |
| DELETE | `/agents/:id` | Delete agent |

**Contexts**

| Method | Path | Description |
|---|---|---|
| GET | `/contexts` | List user's contexts |
| GET | `/contexts/:id` | Get single context |
| POST | `/contexts` | Create context |
| PATCH | `/contexts/:id` | Update context |
| DELETE | `/contexts/:id` | Delete context |

All endpoints require authentication (global JWT guard). All queries filter by `user_id` from the JWT payload — users cannot access other users' resources.

### DTOs

**CreateAgentDto:** `name` (required, max 255), `description` (optional, max 500), `instructions` (required)

**UpdateAgentDto:** All fields optional (PartialType of Create)

**CreateContextDto:** `name` (required, max 255), `description` (optional, max 500), `content` (required)

**UpdateContextDto:** All fields optional (PartialType of Create)

### Frontend Pages

| Route | Purpose |
|---|---|
| `/agents` | List agents with create button |
| `/agents/new` | Create agent form with CodeMirror |
| `/agents/[id]` | Edit agent form with CodeMirror |
| `/contexts` | List contexts with create button |
| `/contexts/new` | Create context form with CodeMirror |
| `/contexts/[id]` | Edit context form with CodeMirror |

### CodeMirror Integration

- Use `@codemirror/lang-markdown` for syntax highlighting
- Use `@codemirror/view` with a minimal theme
- Editor component shared between agents and contexts (`components/ui/markdown-editor.tsx`)
- No preview pane needed — just the editor

### Seed Agents

On first login (when `handleGoogleLogin` creates a new user), seed the user with default agents:

```
1. "1-1 Feedback Evaluator" — Analyses 1-1 meeting notes and extracts:
   key themes, action items, sentiment, and areas for follow-up.
```

Seed agents are stored as constants in `backend/src/agents/seeds/default-agents.ts`. They are inserted with `is_default: true` so the UI can badge them as "Default" (though they're fully editable/deletable).

### User Isolation

Every service method receives `userId` from the controller (extracted from JWT). Queries always include `where: { userId }`. The controller validates ownership on get/update/delete by checking the returned entity's userId matches — a `NotFoundException` is thrown if the entity doesn't exist or belongs to another user.

---

## Acceptance Criteria

1. Authenticated user sees their agents listed (name, description, date)
2. User can create an agent with name, description, and markdown instructions (CodeMirror)
3. User can edit an existing agent — markdown loads in CodeMirror, changes persist
4. User can delete an agent
5. Authenticated user sees their context items listed (name, description, date)
6. User can create a context item with name, description, and markdown content (CodeMirror)
7. User can edit an existing context item — markdown loads in CodeMirror, changes persist
8. User can delete a context item
9. Users cannot see or modify another user's agents or context
10. New users receive seed agents on first sign-up

---

## Key Design Decisions

1. **Separate entities for Agent and Context** — though similar in structure, they serve different roles in the pipeline (instructions vs. supplementary data) and will diverge as features are added
2. **`source_type` on contexts** — future-proofs for Confluence/external source integration without schema change
3. **`is_default` on agents** — lets UI badge seed agents; users can still edit/delete them
4. **Shared CodeMirror component** — single `MarkdownEditor` component used by both agents and contexts forms
5. **Seed on user creation** — simplest approach; triggered in AuthService when a new user is created
6. **No soft delete** — hard delete for now; can add soft delete later if audit/recovery needed

---

## Alternatives Considered

| Alternative | Why rejected |
|---|---|
| Single "document" entity for both agents and context | Different semantics, different pipeline roles; would require a `type` discriminator and mixed queries |
| Store markdown in S3 | Overkill for user-authored content of moderate size; adds complexity and latency |
| Use a rich-text editor (TipTap, ProseMirror) | Markdown is the canonical format for AI prompts; CodeMirror is lighter and preserves raw markdown |
| Seed agents via migration | Agents are user-scoped; migrations run globally. Seeding must happen per-user on creation |

---

## Dependencies

### New npm packages (backend)
- None — uses existing TypeORM, class-validator, NestJS modules

### New npm packages (frontend)
- `codemirror` — core editor
- `@codemirror/lang-markdown` — markdown language support
- `@codemirror/theme-one-dark` — dark theme (optional, can use default)
- `@codemirror/view` — editor view
- `@codemirror/state` — editor state

---

## Infrastructure Addendum

No new cloud resources required. No infra changes.

---

## Security Considerations

- User isolation enforced at service layer (not just controller) — every query filters by userId
- No confidential/PII data involved — agents and context are classified as `internal`
- Standard input validation via class-validator (max lengths, required fields)
- No new public endpoints — all behind JWT guard
