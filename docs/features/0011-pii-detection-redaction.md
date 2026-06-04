# 0011 — PII Detection and Redaction

**Date:** 2026-06-04
**Status:** In Progress
**Source:** Manual
**Related proposal:** docs/proposals/0010-pii-detection-redaction.md

## Summary

Automatically detect and redact personally identifiable information (PII) from
conversations during import from Google Drive or Fireflies.ai, replacing detected
PII with `[REDACTED]` before storage and notifying the user when redaction occurs.

## Background / Motivation

Conversations imported into Converser are classified as `confidential` and may contain
PII that participants inadvertently share during meetings — email addresses, phone
numbers, physical addresses, national ID numbers, credit card numbers, or dates of
birth. Under ISO 27001:2022 and general data minimisation principles, PII should not be
stored unless strictly necessary. Since Converser's purpose is to analyse conversation
themes and not to store personal identifiers, redacting PII at ingestion time reduces
compliance risk and limits the blast radius of any data breach.

## Scope

**In scope**
- PII detection applied to all conversation content at import time (both Google Drive and Fireflies sources)
- Detection of: email addresses, phone numbers, physical/mailing addresses, national ID numbers (SSN, NI number, TFN, etc.), credit card numbers, dates of birth
- Replacement of detected PII with `[REDACTED]` in stored content
- User notification when PII is detected and removed from an imported document
- PII detection as a shared service usable by any future import source

**Out of scope**
- Retroactive scanning of already-imported conversations
- User-configurable redaction rules or allow-lists
- Redacting PII from report output (agent-generated content)
- ML/AI-based PII detection (use regex/pattern-based for now)
- Redacting participant names (these are intentional meeting data)

## Acceptance Criteria

- Given a conversation is imported from Google Drive or Fireflies, when PII is detected in the content, then it is replaced with `[REDACTED]` before storage
- Given PII was detected during import, when the import completes, then the user is informed that PII was found and redacted
- Given a stored conversation, then it never contains raw email addresses, phone numbers, physical addresses, national ID numbers (SSN, NI, etc.), credit card numbers, or dates of birth
- Given a conversation with no PII, when imported, then the content is stored unchanged and no redaction notice is shown

## Open Questions

- Should the redaction notice include a count of items redacted or the categories of PII found (e.g. "2 email addresses and 1 phone number redacted")?
- Should there be an audit log entry for each redaction event (for ISO 27001 compliance evidence)?

## Notes

- Pattern-based detection is preferred over AI-based for determinism, speed, and no external API dependency
- The service should be designed as a standalone module so it can be applied to future ingestion sources
- Conversation content is already classified as `confidential` — this feature adds defence-in-depth
- Must not redact participant/speaker names (which are intentional metadata)
