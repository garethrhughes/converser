# 0010 — Fireflies.ai Transcript Import

**Date:** 2026-06-04
**Status:** In Progress
**Source:** Manual
**Related proposal:** docs/proposals/0009-fireflies-transcript-import.md

## Summary

Allow users to import meeting transcripts from Fireflies.ai, converting structured
speaker-attributed sentences into markdown and storing them as Conversations within
Converser.

## Background / Motivation

Converser currently ingests conversations only from Google Drive. Many users record
meetings with Fireflies.ai and want to analyse those transcripts using the same agent
pipeline (categorisation, theme extraction, reporting). Adding Fireflies as a second
ingestion source broadens the product's utility without changing downstream processing.

## Scope

**In scope**
- Backend integration with the Fireflies.ai GraphQL API
- Secure storage and management of per-user Fireflies API keys
- Listing available Fireflies meetings for the authenticated user
- Importing a selected meeting transcript and converting to markdown
- Storing imported transcripts as Conversation entities (confidential, KMS-encrypted)
- Frontend UI for connecting Fireflies (API key entry) and selecting meetings to import
- Error handling for rate limits, invalid keys, and API unavailability

**Out of scope**
- Webhook-based automatic ingestion (future enhancement)
- Bulk/batch import of all meetings at once
- Fireflies audio/video file import
- Editing or re-syncing already-imported transcripts

## Acceptance Criteria

- Given a user has provided a valid Fireflies API key, when they navigate to the import UI, then they can see a list of their Fireflies meetings
- Given a user selects a specific meeting from the list, when they confirm import, then the transcript is fetched, converted to markdown (with speaker names and timestamps), and stored as a Conversation entity
- Given the imported transcript, then it is stored with `confidential` data classification and encrypted at rest with customer-managed KMS
- Given the Fireflies API is rate-limited or unavailable, then the system handles errors gracefully with appropriate user feedback

## Open Questions

- Should the Fireflies API key be stored per-user in the database (encrypted) or entered per-session? (Recommendation: stored per-user for convenience, encrypted with KMS)
- Should we display Fireflies meeting summaries/metadata in the listing, or just title + date + participants?
- Do we need pagination in the meeting list UI given the 50-per-query API limit?

## Notes

- Fireflies.ai uses a GraphQL API (`POST https://api.fireflies.ai/graphql`)
- Authentication is via a static Bearer token (API key) — no OAuth flow available
- Rate limits: Free = 50 req/day, Pro = 500/day, Business/Enterprise = 60/min
- Transcripts are returned as structured `sentences` arrays with speaker name, text, and timestamps
- The API also provides AI-generated summaries, action items, and topics which could enrich the stored conversation metadata
- API key is user-specific; per-user key storage is required
