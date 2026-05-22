# 0006 — Memory Evolution

**Date:** 2026-05-22
**Status:** In Progress
**Source:** Manual
**Related proposal:** docs/proposals/0006-memory-evolution.md

## Summary

Evolve the memory extraction system so that new reports update, modify, or clarify existing memories rather than only appending new items. Track and display memory changes (added/updated/removed) on each report.

## Background / Motivation

Currently, memory extraction only appends new items. Over time this leads to stale or contradictory entries — e.g. an action item that was completed still appears as pending, or a preference that changed is listed alongside the new preference. The system needs to treat memories as a living document that evolves with each conversation. Additionally, users have no visibility into how memories changed after a report — they can't see what was learned or updated.

## Scope

**In scope**
- Modify the extraction prompt to receive existing memories and return a structured diff (add/update/remove).
- Apply the diff to persisted memories (create new, update existing, soft-remove outdated).
- Store the memory diff (changes made) on the report entity.
- Display memory changes at the bottom of the report detail page.
- Update the default and custom extraction prompt format.

**Out of scope**
- Full audit trail / version history of individual memory items (future enhancement).
- Undo/revert memory changes from the UI.
- Manual memory creation (already out of scope from 0005).

## Acceptance Criteria

- Given a person has existing memories and a new report is generated, the extraction step receives the current memories and returns structured changes (add/update/remove).
- Given the extraction returns an update to an existing memory, that memory's content is modified in the database.
- Given the extraction returns a removal of an existing memory, that memory is deleted from the database.
- Given a report triggers memory changes, those changes are stored as structured data on the report.
- Given a user views a report detail page, the memory changes are displayed at the bottom (what was added, updated, removed).
- The default extraction prompt instructs the model to compare against existing memories and return a diff.

## Open Questions

None.

## Notes

- The extraction response format needs to change from a simple `string[]` to a structured format that identifies adds, updates (with memory ID), and removals (with memory ID).
- Existing memories should be passed to the extraction prompt so the model can reference them.
- Memory changes should be stored as JSON on the report (not a separate table) since they are a snapshot of what happened at that point in time.
