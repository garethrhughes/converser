# 0001 — Google OAuth 2.0 Authentication

**Date:** 2026-05-21
**Status:** Accepted
**Author:** Architect
**Feature:** docs/features/0001-google-oauth-authentication.md

---

## Problem / Motivation

Converser requires authenticated access to associate data (conversations, people, reports) with a specific user. Users must log in with Google (settled decision #2). The Google Drive readonly scope is needed for future conversation ingestion and should be requested at initial consent to avoid a second prompt later.

---

## Proposed Solution

Implement a full OAuth 2.0 Authorization Code flow with Google as the OIDC provider, issuing application-level JWTs for API access.

### Flow

```
Browser → GET /auth/google → 302 to Google consent screen
Google → GET /auth/google/callback?code=... → Backend exchanges code for tokens
Backend → Creates/updates User entity, stores hashed refresh token + encrypted Google tokens
Backend → Returns JWT access token (15min) + refresh token (7 days) to frontend
Frontend → Stores access token in memory, refresh token in httpOnly cookie
Frontend → On 401, calls POST /auth/refresh → gets new token pair
Frontend → On refresh failure, redirects to /auth/google
```

### Components

| Component | Location | Responsibility |
|---|---|---|
| `AuthModule` | `backend/src/auth/auth.module.ts` | NestJS module wiring |
| `AuthController` | `backend/src/auth/auth.controller.ts` | Thin controller: `/auth/google`, `/auth/google/callback`, `/auth/refresh`, `/auth/logout` |
| `AuthService` | `backend/src/auth/auth.service.ts` | Token generation, refresh rotation, Google token exchange |
| `GoogleStrategy` | `backend/src/auth/strategies/google.strategy.ts` | Passport Google OAuth2 strategy |
| `JwtStrategy` | `backend/src/auth/strategies/jwt.strategy.ts` | Passport JWT strategy for access tokens |
| `JwtAuthGuard` | `backend/src/auth/guards/jwt-auth.guard.ts` | Global guard, skips public routes |
| `Public` decorator | `backend/src/auth/decorators/public.decorator.ts` | Marks routes as public (no auth required) |
| `User` entity | `backend/src/database/entities/user.entity.ts` | Stores user profile + hashed refresh token + encrypted Google tokens |
| Migration | `backend/src/database/migrations/` | Creates `users` table |
| Frontend auth lib | `frontend/lib/auth.ts` | Token storage, refresh logic, redirect |
| Auth middleware | `frontend/` (Next.js middleware) | Route protection, redirect to login |

### Database Schema — `users` table

| Column | Type | Notes |
|---|---|---|
| `id` | uuid (PK) | Generated |
| `google_id` | varchar, unique | Google subject ID |
| `email` | varchar, unique | From OIDC profile |
| `name` | varchar | Display name |
| `picture` | varchar, nullable | Profile picture URL |
| `hashed_refresh_token` | varchar, nullable | bcrypt hash of current app refresh token |
| `google_access_token_enc` | varchar, nullable | AES-256-GCM encrypted Google access token |
| `google_refresh_token_enc` | varchar, nullable | AES-256-GCM encrypted Google refresh token |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

### Token Strategy

| Token | Lifetime | Storage (frontend) | Storage (backend) |
|---|---|---|---|
| JWT access token | 15 minutes | In-memory (JS variable) | Not stored — stateless validation |
| App refresh token | 7 days | httpOnly, Secure, SameSite=Strict cookie | bcrypt hash in `users.hashed_refresh_token` |
| Google access token | ~1 hour (Google-controlled) | Not stored in frontend | AES-256-GCM encrypted in DB |
| Google refresh token | Long-lived | Not stored in frontend | AES-256-GCM encrypted in DB |

### Refresh Token Rotation

On each `/auth/refresh` call:
1. Validate the refresh token from the httpOnly cookie against the stored hash
2. Issue a new access token + new refresh token
3. Hash the new refresh token and overwrite the old hash in the DB
4. Set the new refresh token in the httpOnly cookie
5. If validation fails (token reuse detection), clear all tokens and force re-login

### Security Considerations

- Refresh tokens stored as bcrypt hashes — no plaintext in DB
- Google tokens encrypted with AES-256-GCM using a key from `ConfigService` (sourced from SSM Parameter Store in prod)
- Access tokens are short-lived (15min) and stateless — no DB lookup on every request
- httpOnly + Secure + SameSite=Strict cookie prevents XSS token theft
- CSRF protection via SameSite=Strict + origin checking
- Rate limiting: 5 login attempts per minute per IP (future enhancement, noted but not in scope for v1)
- Token reuse detection on refresh rotation (invalidates all tokens if reuse detected)

### OAuth Scopes

```
openid email profile https://www.googleapis.com/auth/drive.readonly
```

### Public (Unauthenticated) Endpoints

- `GET /health`
- `GET /api-docs`
- `GET /auth/google`
- `GET /auth/google/callback`
- `POST /auth/refresh`

All other routes require a valid JWT access token.

---

## Acceptance Criteria

1. Given an unauthenticated user, when they visit any page, then they are redirected to Google sign-in
2. Given a successful Google sign-in, when the callback is received, then a 15-min JWT access token and 7-day refresh token are issued
3. Given a valid refresh token, when the access token expires, then the token is silently rotated and a new access/refresh pair is issued
4. Given an expired or invalid refresh token, when a refresh is attempted, then the user is redirected to Google sign-in
5. Given an authenticated request, when it hits any route except `/health` and `/api-docs`, then the JWT auth guard validates the access token
6. Given a request to `/health` or `/api-docs`, when no auth token is present, then the request succeeds (public endpoints)
7. Given the OAuth flow, when scopes are requested, then `openid`, `email`, `profile`, and `https://www.googleapis.com/auth/drive.readonly` are included

---

## Key Design Decisions

1. **Passport.js for OAuth strategy** — mature, well-documented, integrates cleanly with NestJS guards
2. **httpOnly cookie for refresh token** — prevents XSS access; SameSite=Strict prevents CSRF
3. **In-memory access token (frontend)** — never persisted to localStorage/sessionStorage to limit XSS exposure
4. **Bcrypt for refresh token hashing** — industry standard, includes salt, resistant to rainbow tables
5. **AES-256-GCM for Google token encryption** — authenticated encryption prevents tampering; key managed via ConfigService
6. **Global JWT guard with `@Public()` decorator** — secure by default; explicitly opt routes out of auth rather than opting in

---

## Alternatives Considered

| Alternative | Why rejected |
|---|---|
| Session-based auth (server-side sessions) | Doesn't scale horizontally without a session store; JWTs are stateless |
| Store refresh token in localStorage | Vulnerable to XSS |
| Store Google tokens unencrypted | Classified as confidential; ISO 27001 requires encryption for confidential data at rest |
| Request Drive scope lazily (on first Drive use) | Requires a second consent prompt, worse UX |

---

## Dependencies

### New npm packages (backend)
- `passport-google-oauth20` — Google OAuth2 strategy for Passport
- `bcrypt` + `@types/bcrypt` — refresh token hashing
- No new packages for AES-256-GCM (Node.js `crypto` module)

### Existing packages already installed
- `@nestjs/passport`, `passport`, `passport-jwt`, `@nestjs/jwt` — already in package.json

---

## Infrastructure Addendum

No new cloud resources required for this feature. Configuration additions:

| Parameter | Location | Notes |
|---|---|---|
| `GOOGLE_CLIENT_ID` | SSM Parameter Store (prod) / `.env` (local) | Already in `.env.example` |
| `GOOGLE_CLIENT_SECRET` | SSM Parameter Store SecureString (prod) / `.env` (local) | Already in `.env.example` |
| `JWT_SECRET` | SSM Parameter Store SecureString (prod) / `.env` (local) | Already in `.env.example` |
| `GOOGLE_TOKEN_ENCRYPTION_KEY` | SSM Parameter Store SecureString (prod) / `.env` (local) | **New** — 32-byte hex key for AES-256-GCM |

---

## Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Google token encryption key leak | Store in SSM SecureString; never log; rotate via key versioning |
| Refresh token reuse (session hijacking) | Rotation + reuse detection invalidates all sessions |
| Google revokes refresh token | Catch error on Drive API call, prompt re-auth |

---

## Out of Scope (future)

- Rate limiting on auth endpoints
- Multi-device session management
- Account deletion / GDPR right-to-erasure flow
- Role-based access control
