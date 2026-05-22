# 0003 — BedrockService Lives in ReportsModule

**Date:** 2026-05-22
**Status:** Accepted
**Deciders:** Architect Agent, Developer
**Proposal:** docs/proposals/0004-conversation-analysis-workflow.md

## Context

The system needs a service to invoke Bedrock. Could live in a shared module or within the reports module.

## Options Considered

### Option A — Shared BedrockModule at Root

Create a standalone `BedrockModule` at the application root that any module can import. Provides a single shared `BedrockService` instance.

### Option B — BedrockService Inside ReportsModule

Place `BedrockService` inside `ReportsModule` and export it for use by other modules that need it (currently only `PeopleModule` for memory extraction).

## Decision

BedrockService lives inside the ReportsModule since agent execution only makes sense in the context of producing a report. Exported for use by PeopleModule (memory extraction).

## Rationale

Avoids premature abstraction. If other modules need Bedrock later, it can be extracted. Currently only reports and memory use it.

## Consequences

- **Positive:** Simple dependency graph, no extra module to maintain, clear ownership of Bedrock integration.
- **Negative / trade-offs:** Circular dependency needed between Reports and People (resolved with forwardRef).
- **Risks:** If more modules need Bedrock, extraction to a shared module becomes necessary — but that refactor is straightforward.
