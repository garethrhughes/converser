# 0002 — Agent & Context Management

**Date:** 2026-05-21
**Status:** In Progress
**Source:** Manual
**Related proposal:** docs/proposals/0002-agent-context-management.md

## Summary

Users can create, edit, and delete Agents (named markdown instruction sets used as system prompts for Bedrock) and Context items (named markdown documents providing background information included alongside conversations when agents run). Both are user-scoped with a CodeMirror markdown editor for content editing.

## Background / Motivation

Converser's core pipeline is: Ingest Content → Select Agent(s) → Select Context → Run Agents → Produce Output. Before building the execution pipeline, users need the ability to manage the Agents and Context that drive it. Agent instructions are user-configurable (settled decision #8) — default agents provide basic examples around evaluating 1-1 meeting feedback, but users can customise or create their own. Context provides additional background (company info, customer details, team structure) that augments the conversation data sent to the model.

## Scope

**In scope**
- Agent entity: name, description, markdown instructions, user-scoped
- Context entity: name, description, markdown content, user-scoped
- Full CRUD API for both (backend)
- Frontend list/create/edit/delete pages for both
- CodeMirror markdown editor for instruction/content editing
- Seed agents created for new users on first sign-up (e.g. "1-1 Feedback Evaluator")
- User isolation — users only see their own agents and context

**Out of scope**
- Bedrock invocation / agent execution pipeline (separate feature)
- Conversation ingestion from Google Drive (separate feature)
- Sharing agents or context between users
- Versioning / history of edits
- Connecting context to external sources (Confluence, etc.) — future enhancement
- Categories / themes (separate feature)

## Acceptance Criteria

- Given an authenticated user, when they navigate to the agents page, then they see a list of their agents (name, description, created date)
- Given an authenticated user, when they create a new agent, then they can provide a name, description, and markdown instructions via a CodeMirror editor
- Given an authenticated user, when they edit an agent, then the existing markdown loads in CodeMirror and changes are saved
- Given an authenticated user, when they delete an agent, then it is removed and no longer visible
- Given an authenticated user, when they navigate to the context page, then they see a list of their context items (name, description, created date)
- Given an authenticated user, when they create a new context item, then they can provide a name, description, and markdown content via a CodeMirror editor
- Given an authenticated user, when they edit a context item, then the existing markdown loads in CodeMirror and changes are saved
- Given an authenticated user, when they delete a context item, then it is removed and no longer visible
- Given a user, they cannot see or modify another user's agents or context items
- Given the system ships default agents, when a new user signs up, then they receive seed agents (e.g. "1-1 Feedback Evaluator") they can customise or delete

## Open Questions

None.

## Notes

- Agent instructions and context content are classified as `internal` (not confidential) — they are user-authored prompts, not conversation data.
- Context is markdown now but could expand to connected sources (Confluence, etc.) in future — design the entity to allow a `source_type` field later.
- Default seed agents should be easily maintainable — consider storing them as files or constants that get copied to new users.
