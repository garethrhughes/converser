# 0007 — Memory Changes as JSONB on Reports

**Date:** 2026-05-22
**Status:** Accepted
**Deciders:** Architect Agent, Developer
**Proposal:** docs/proposals/0006-memory-evolution.md

## Context

Memory changes (add/update/remove) from extraction need to be stored for display on the report. Could be a separate table or JSONB on the report.

## Options Considered

### Option A — Separate memory_changes Table with FK to Report

Create a `memory_changes` table with columns for change type, key, old value, new value, and a foreign key to the reports table. Allows relational querying across reports.

### Option B — JSONB Column on Reports Table

Add a `memory_changes` JSONB column to the existing `reports` table. Store the array of changes inline with the report row.

## Decision

Store memory changes as a JSONB column on the reports table.

## Rationale

Changes are a snapshot tied to a specific report — they don't need independent querying. JSONB keeps the data co-located with its context, avoids an extra join, and the structure is simple enough that denormalisation is appropriate.

## Consequences

- **Positive:** Simple queries, no joins, atomic with report creation, easy to render in the UI from a single query.
- **Negative / trade-offs:** Can't query individual changes across reports efficiently (e.g., "show all reports that updated key X").
- **Risks:** If we need cross-report memory analytics later, migration to a normalised table may be needed.
