# 0005 — Person Memory

**Date:** 2026-05-22
**Status:** In Progress
**Source:** Manual
**Related proposal:** docs/proposals/0005-person-memory.md

## Summary

Automatically extract key items (facts, themes, action items) from generated reports and persist them as memory entries on the associated person. Memory accumulates across conversations and is included as context in future Bedrock invocations for that person. Users can view, edit, and delete individual memory items.

## Background / Motivation

Currently, each report is generated in isolation — the agent has no knowledge of prior interactions with a person. This means recurring themes, agreed action items, and established facts must be re-stated in contexts manually or get lost between sessions. By extracting and persisting key items as memory, the system builds an evolving understanding of each person over time, making future analyses richer and more contextually aware without manual effort.

## Scope

**In scope**
- A new Memory entity linked to a Person (and optionally to the source Report).
- Automatic extraction of key items from a report after generation (via a second Bedrock call or structured output parsing).
- Persistence of extracted items as individual memory entries on the person.
- Inclusion of a person's accumulated memory in the system prompt for future Bedrock invocations.
- CRUD UI for memory items on the person detail page (view, edit, delete).
- Backend API endpoints for memory management.

**Out of scope**
- Semantic deduplication of memory items (future enhancement).
- Automatic summarisation/compression of memory when it grows large.
- Memory shared across people.
- Manual memory creation by the user (can be added later, but not required for v1).

## Acceptance Criteria

- Given a report is generated for a person, key items are automatically extracted and stored as memory entries on that person.
- Memory accumulates across conversations — new items are added, existing items are not overwritten or replaced.
- Given a person has memory items, they are included in the system prompt for future Bedrock invocations for that person.
- The user can view all memory items for a person.
- The user can edit an individual memory item's content.
- The user can delete an individual memory item.

## Open Questions

- What format should extracted memory items take? (e.g. short factual statements, key-value pairs, free-form text snippets)
- Should there be a limit on the number of memory items per person to avoid exceeding Bedrock's context window?
- Should memory extraction use a separate Bedrock call with a dedicated extraction prompt, or should the main agent be instructed to output structured memory items as part of its response?

## Notes

- Memory content should be classified as `confidential` (same as conversation content) since it is derived from conversations.
- The extraction step must not block the user from seeing their report — it can happen after the report is returned.
- Consider token budget: accumulated memory for a person will grow over time and consume system prompt tokens. A future feature may need to summarise or prune, but for v1 simply concatenating all items is acceptable.
