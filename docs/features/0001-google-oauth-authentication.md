# 0001 — Google OAuth 2.0 Authentication

**Date:** 2026-05-21
**Status:** In Progress
**Source:** Manual
**Related proposal:** docs/proposals/0001-google-oauth-authentication.md

## Summary

Users must authenticate via Google OAuth 2.0 (OIDC) to access Converser. The backend issues short-lived JWT access tokens (15 min) and rotating refresh tokens (7 days). The Google Drive readonly scope is requested upfront for future conversation ingestion.

## Background / Motivation

Converser requires user identity to associate conversations, people, and reports with a specific user. Google OAuth is the settled decision for authentication (ADR #2). The Drive readonly scope is requested at login to avoid a second consent prompt when the conversation ingestion feature is built.

## Scope

**In scope**
- Google OAuth 2.0 OIDC sign-in flow (backend + frontend redirect)
- JWT access token (15-min expiry) and refresh token (7-day expiry) issuance
- Refresh token rotation on use
- Global auth guard protecting all routes except `/health` and `/api-docs`
- Frontend redirect-to-login on unauthenticated/expired state
- Silent token refresh when access token expires but refresh token is valid
- OAuth scopes: `openid`, `email`, `profile`, `https://www.googleapis.com/auth/drive.readonly`

**Out of scope**
- Google Drive API integration (separate feature)
- Role-based access control / permissions
- User profile management UI
- Account linking or multiple auth providers

## Acceptance Criteria

- Given an unauthenticated user, when they visit any page, then they are redirected to Google sign-in
- Given a successful Google sign-in, when the callback is received, then a 15-min JWT access token and 7-day refresh token are issued
- Given a valid refresh token, when the access token expires, then the token is silently rotated and a new access/refresh pair is issued
- Given an expired or invalid refresh token, when a refresh is attempted, then the user is redirected to Google sign-in
- Given an authenticated request, when it hits any route except `/health` and `/api-docs`, then the JWT auth guard validates the access token
- Given a request to `/health` or `/api-docs`, when no auth token is present, then the request succeeds (public endpoints)
- Given the OAuth flow, when scopes are requested, then `openid`, `email`, `profile`, and `https://www.googleapis.com/auth/drive.readonly` are included

## Open Questions

None.

## Notes

- The Google OAuth tokens (including the Drive access token) received from Google should be stored securely for later use by the Drive ingestion feature.
- Refresh tokens must be stored hashed in the database, never in plaintext.
- The user entity will need to be created as part of this feature (email, name, Google ID, hashed refresh token).
