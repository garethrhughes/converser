# 0006 — Fire-and-Forget Memory Extraction

**Date:** 2026-05-22
**Status:** Accepted
**Deciders:** Architect Agent, Developer
**Proposal:** docs/proposals/0005-person-memory.md

## Context

After generating a report, memory extraction needs to happen. Could be synchronous (block response), queued (SQS/Bull), or fire-and-forget (setImmediate).

## Options Considered

### Option A — Synchronous (Block Response)

Wait for memory extraction to complete before returning the report response to the client. Simplest implementation but adds 2-5 seconds to response time.

### Option B — Queue-Based Async (SQS or Bull)

Publish a message to a queue after report generation. A worker processes extraction asynchronously with retry semantics and dead-letter handling.

### Option C — Fire-and-Forget in Same Process (setImmediate)

Return the report response immediately, then invoke memory extraction via `setImmediate` in the same Node.js process. No additional infrastructure.

## Decision

Fire-and-forget using setImmediate after the report response is sent. No queue infrastructure.

## Rationale

Extraction takes 2-5 seconds — acceptable latency for background work. A queue adds infrastructure complexity (Redis or SQS) for no user-facing benefit at current scale. The report is returned immediately; extraction happens after.

## Consequences

- **Positive:** No infrastructure cost, immediate report response, simple implementation.
- **Negative / trade-offs:** Extraction failure is silent (logged only), no automatic retry mechanism.
- **Risks:** If server crashes during extraction, the memory update is lost (acceptable for v1). If extraction needs reliability guarantees later, migrate to a queue.
