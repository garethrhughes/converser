# 0001 — Google OAuth 2.0 with Auth Code Exchange Pattern

**Date:** 2026-05-21
**Status:** Accepted
**Proposal:** docs/proposals/0001-google-oauth-authentication.md

## Context

Converser requires authenticated access. Google OAuth 2.0 (OIDC) was chosen as the identity provider (settled decision #2). The implementation needs to securely issue application-level JWTs after Google authentication.

## Decision

1. **Auth code exchange pattern** — The OAuth callback redirects to the frontend with a short-lived (60s), single-use authorization code. The frontend exchanges this code via POST for tokens. This avoids exposing JWTs in URLs.

2. **Token type claims** — Access and refresh JWTs include a `type` claim (`'access'` or `'refresh'`). The JWT strategy rejects tokens with the wrong type, preventing token confusion attacks.

3. **AES-256-GCM for Google token encryption** — Google access/refresh tokens are encrypted at rest using AES-256-GCM with a dedicated encryption key. This satisfies ISO 27001 requirements for confidential data.

4. **httpOnly cookie for refresh tokens** — Refresh tokens are stored in a httpOnly, Secure, SameSite=Strict cookie to prevent XSS access. The cookie path is `/` to allow middleware detection.

5. **In-memory auth code store (accepted risk)** — Auth codes are stored in an in-memory Map with 60-second TTL. This is acceptable for single-instance deployment. For horizontal scaling, migrate to Redis. This is documented as a known limitation.

## Consequences

- Application fails fast if encryption key or JWT secret is not configured
- Horizontal scaling requires migrating auth code store to Redis
- Google Drive access tokens are available encrypted in the DB for future ingestion feature
- Rate limiting on auth endpoints prevents brute-force attacks
