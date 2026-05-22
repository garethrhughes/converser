# 0004 — Conversation Analysis Workflow

**Date:** 2026-05-22
**Status:** In Progress
**Source:** Manual
**Related proposal:** docs/proposals/0004-conversation-analysis-workflow.md

## Summary

Replace the home page with a guided workflow that walks the user through selecting a person, conversation (and tab if applicable), context(s), and agent — then invokes AWS Bedrock to analyse the conversation and stores the markdown-formatted output as a report linked to the selected person.

## Background / Motivation

Converser can currently ingest conversations from Google Drive, manage agents with configurable instructions, and manage contexts (user-authored background content). However, there is no execution pipeline — no way to actually invoke an agent against a conversation to produce analysis output. This feature closes the core loop: ingest → analyse → report. The home page currently serves only as a landing page with links; replacing it with the workflow gives users immediate access to the primary action.

## Scope

**In scope**
- A new guided workflow UI on the home page (replacing the current welcome content).
- Step-by-step selection: Person → Conversation → Tab (if multiple sections) → Context(s) → Agent.
- Backend endpoint to invoke AWS Bedrock with the selected conversation content, context(s), and agent instructions.
- A new Report entity stored in the database with markdown-formatted output, linked to the person.
- Display of the Bedrock response to the user after completion.

**Out of scope**
- Themes, categories, or structured JSON parsing of agent output (future feature).
- Batch processing of multiple conversations.
- Report editing, export, or sharing.
- Changes to the sidebar navigation structure.
- Streaming Bedrock responses (initial implementation is request/response).

## Acceptance Criteria

- Given a user on the home page, they see the guided workflow steps instead of the current welcome content.
- Given a selected person, their conversations are listed for selection.
- Given a conversation with multiple sections (tabs), the user must select which section to analyse.
- Given a conversation with a single section, the section selection step is automatically skipped.
- Given selected person, conversation/section, context(s), and agent, invoking the workflow sends the conversation content + selected contexts to Bedrock using the agent's instructions.
- Bedrock credentials are read from environment configuration via ConfigService.
- Given a successful Bedrock invocation, the output is stored in the database in markdown format as a report linked to the selected person.
- The stored report is visible in a list of reports under that person.

## Open Questions

- Should the user be able to select multiple contexts, or exactly one? (Assumed: multiple.)
- What Bedrock model should be configurable or fixed? (Assumed: configurable via `AWS_BEDROCK_MODEL_ID` env var, already present.)
- Should there be a loading/progress indicator during Bedrock invocation? (Assumed: yes, simple loading state.)

## Notes

- The `AWS_REGION` and `AWS_BEDROCK_MODEL_ID` environment variables already exist in `.env.example` but no Bedrock SDK integration exists yet.
- `ConversationSection` is the existing entity representing "tabs" — each has a `title`, `content`, and `order`.
- The default seeded agent ("1-1 Feedback Evaluator") expects to produce JSON output with themes/actionItems/summary, but this feature stores raw markdown output — structured parsing is deferred to a future feature.
- All entities are user-scoped; the report must also be user-scoped.
