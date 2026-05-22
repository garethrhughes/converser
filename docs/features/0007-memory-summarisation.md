# 0007 — Memory Summarisation

**Date:** 2026-05-22
**Status:** Implemented
**Source:** Manual
**Related proposal:** *(populated after Step 1)*

## Summary

Automatically summarise and compress a person's memory when it grows large, using the existing memory extraction Bedrock call (no additional invocation). The extraction prompt is extended to consolidate related/redundant items as part of its normal diff response.

## Background / Motivation

Memory items accumulate over time without bound. Related items may overlap (e.g. "Prefers async communication" and "Doesn't like synchronous meetings" are essentially the same fact). As the memory list grows, it consumes more tokens in the system prompt and becomes harder for the user to scan. Rather than adding a separate summarisation step (which would double Bedrock costs), the existing extraction call already receives all current memories — it can be instructed to consolidate them as part of its normal add/update/remove diff.

## Scope

**In scope**
- Extend the extraction prompt to instruct the model to consolidate related/redundant memories.
- Consolidation expressed as updates (merge N items into 1) + removals (of the N-1 originals).
- This happens naturally within the existing extraction Bedrock call — no new invocation.
- Memory changes on the report show consolidations clearly.

**Out of scope**
- Token counting or hard limits on memory size (future enhancement).
- A separate "summarise now" button/manual trigger.
- Changing the extraction response format (still add/update/remove).

## Acceptance Criteria

- Given a person has many memory items (including related/redundant ones), the extraction call consolidates them as part of its diff response.
- No additional Bedrock invocation is made — summarisation happens within the existing extraction call.
- Consolidated memories appear as updates (one item updated to be a merged summary) and removals (of the now-redundant originals) in the memory_changes on the report.
- The user can see what was consolidated in the report's memory changes section.
- The default extraction prompt includes consolidation instructions.

## Open Questions

None.

## Notes

- The existing extraction prompt already receives all memories with IDs and returns a structured diff. The only change is adding consolidation instructions to that prompt.
- This is a prompt-level change with no schema, API, or frontend modifications needed (the existing memory_changes display already handles updates and removals).
