# 0003 — Conversations & People Management

**Date:** 2026-05-21
**Status:** In Progress
**Source:** Manual
**Related proposal:** docs/proposals/0003-conversations-people-management.md

## Summary

Users can import conversations from Google Drive (Google Docs) via the Drive Picker UI, with content converted to Markdown and stored locally. Multi-tab docs are split into sections within a single Conversation. Users can view conversations (CodeMirror), delete them, and link them to People/Clients. People/Clients are a new user-scoped CRUD entity.

## Background / Motivation

Conversations are the core input to Converser's pipeline. Before agents can process conversations, they need to be ingested and stored. Google Drive is the initial conversation source (settled decision #4). People/Clients provide the organisational structure for grouping conversations — each conversation relates to a person the user has 1-1s or meetings with.

## Scope

**In scope**
- Conversation entity with sections (one-to-many)
- Google Drive Picker integration (restricted to Google Docs / text files)
- Import flow: fetch doc content via Google Docs API, convert to Markdown, store sections per tab
- Conversation list page (title, source, person, date)
- Conversation view page with tab-based section navigation (CodeMirror read-only)
- Conversation delete (cascades to sections)
- Person/Client entity: name, description, user-scoped CRUD
- Link conversation to a person at import time (optional)
- Sidebar navigation updates for Conversations and People

**Out of scope**
- Editing imported conversation content
- Importing from sources other than Google Drive
- Bulk import / folder import
- Running agents on conversations (separate feature)
- Themes / categories (separate feature)
- Reports (separate feature)

## Acceptance Criteria

- Given an authenticated user, when they click "Import" on the conversations page, then a Google Drive Picker opens restricted to doc/text files
- Given a user selects a Google Doc, when the import completes, then the document content is converted to Markdown and stored as a Conversation
- Given a Google Doc has multiple tabs, when imported, then each tab is stored as a separate section within the same Conversation
- Given an authenticated user, when they view the conversations page, then they see a list of their conversations (title, source, person/client, date)
- Given an authenticated user, when they view a conversation, then each section is displayed in a CodeMirror editor with tab navigation
- Given an authenticated user, when they delete a conversation, then it and all its sections are removed
- Given an authenticated user, when they navigate to the People page, then they see a list of their people (name, description)
- Given an authenticated user, when they create/edit/delete a person, then standard CRUD operations work
- Given an authenticated user, when importing a conversation, then they can optionally link it to a Person/Client
- Given a user, they cannot see or modify another user's conversations or people

## Open Questions

None.

## Notes

- Conversation content is classified as `confidential` — must be encrypted with customer-managed KMS at rest in production (per CLAUDE.md security rules)
- The user's Google access token (stored encrypted in the User entity) is used to authenticate Google Drive Picker and Docs API calls
- Google Docs API can export documents as Markdown — no custom conversion needed
- Google Drive Picker requires a frontend-loaded JS SDK with the user's access token
- Rate limits: Google Drive API has 100 requests per 100 seconds per user — single doc import is well within limits
