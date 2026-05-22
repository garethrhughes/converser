# 0005 — Memory Lives in PeopleModule

**Date:** 2026-05-22
**Status:** Accepted
**Deciders:** Architect Agent, Developer
**Proposal:** docs/proposals/0005-person-memory.md

## Context

Person memory needs a home. Could be its own module or part of the People module.

## Options Considered

### Option A — Separate MemoryModule

Create a standalone `MemoryModule` with its own service and controller. Would import `PeopleModule` or use repository injection directly.

### Option B — MemoryService Inside PeopleModule

Place `MemoryService` inside `PeopleModule` alongside the existing `PeopleService`. Memory endpoints are nested under `/people/:id/memory`.

## Decision

Memory lives inside PeopleModule since it's tightly coupled to the Person entity lifecycle (cascade deletes, scoped by person).

## Rationale

Memory has no independent existence without a person. Keeping it in PeopleModule means cascade deletes work naturally and the module boundary matches the domain relationship.

## Consequences

- **Positive:** Natural cascade behaviour, no extra module, URL structure reflects domain relationship (`/people/:id/memory`).
- **Negative / trade-offs:** PeopleModule grows in responsibility (more services, more endpoints).
- **Risks:** If memory becomes complex (versioning, vector search, decay algorithms), extraction to its own module may be needed.
