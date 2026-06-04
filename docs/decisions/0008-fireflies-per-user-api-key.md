# 0008 — Fireflies.ai Integration via Per-User API Key

**Date:** 2026-06-04
**Status:** Accepted
**Deciders:** Architect Agent, Developer
**Proposal:** docs/proposals/0009-fireflies-transcript-import.md

## Context

Converser needs to import meeting transcripts from Fireflies.ai as a second ingestion source alongside Google Drive. Fireflies provides a GraphQL API authenticated with a static per-user API key (no OAuth flow available).

## Options Considered

### Option A — Per-User API Key Stored Encrypted on User Entity

Store each user's Fireflies API key encrypted (AES-256-GCM) in a new column on the existing `users` table. Reuse the same encryption key (`GOOGLE_TOKEN_ENCRYPTION_KEY`) already used for Google tokens. Users enter their key once via a settings page.

### Option B — Separate `user_integrations` Table

Create a normalised `user_integrations` table with `(user_id, provider, credentials_enc, connected_at)` to support multiple future integration providers generically.

### Option C — Per-Session Key Entry (No Storage)

Require users to enter their Fireflies API key each session. No server-side storage.

## Decision

Use Option A — per-user API key stored as an encrypted column on the `users` table.

## Rationale

- Follows the established pattern for Google token storage (encrypted columns on `users`)
- Single integration does not warrant the complexity of a separate table (YAGNI)
- Persistent storage provides better UX than per-session entry
- Same encryption mechanism (AES-256-GCM) and key already exist; no new secrets management infrastructure needed
- If a third integration is added in future, migration to a separate table is straightforward

## Consequences

- **Positive:** Consistent with existing credential storage pattern; no new dependencies or infrastructure; simple migration.
- **Negative / trade-offs:** Adding more integrations will eventually require either more columns (messy) or a migration to a normalised table.
- **Risks:** Fireflies API key has no expiry or rotation mechanism — if compromised, user must regenerate on Fireflies and re-enter in Converser. Disconnect action clears the stored key.
