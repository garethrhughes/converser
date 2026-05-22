# CLAUDE.md — Converser

## Active Skillset: typescript

This project follows the language-agnostic core rules in
[`RULES.md`](https://github.com/garethrhughes/skills/blob/main/RULES.md) plus the
**`typescript`** stack overlay in
[`rules/typescript.md`](https://github.com/garethrhughes/skills/blob/main/rules/typescript.md).
Skills (`developer`, `reviewer`, `architect`, `infosec`) read both when applying
conventions to this project.

---

## Project Overview

Converser is a tool to ingest conversations (initially from Google Drive), parse them with custom AI agents (via AWS Bedrock), categorise and report on themes. Conversations are organised by People/Clients. Authentication is via Google OAuth 2.0 (OIDC). Agent instructions are user-configurable — default agents provide basic examples around evaluating 1-1 meeting feedback.

---

## Tech Stack

### Backend
| Concern | Choice |
|---|---|
| Framework | NestJS 11 |
| Language | TypeScript (strict mode) |
| ORM / Data layer | TypeORM (CLI migrations) |
| Auth | Google OAuth 2.0 (OIDC) — JWT bearer with 15-min access + 7-day refresh token rotation |
| API Docs | Swagger via `@nestjs/swagger` at `/api-docs` |
| Testing | Jest + Supertest |
| Migrations | TypeORM CLI — `npm run migration:run`; migrations implement both `up()` and `down()` |
| Validation | class-validator + class-transformer |
| Logging | pino — JSON structured logs, request-scoped child loggers with correlation ID |

### Frontend
| Concern | Choice |
|---|---|
| Framework | Next.js 16 (App Router) + React 19 |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS v4 — CSS-first config via `@theme` in `globals.css` |
| State | Zustand — one store file per concern in `store/` |
| Testing | Vitest + React Testing Library |
| HTTP | Typed `fetch` wrappers in `lib/api.ts` — no direct fetch calls outside this file |
| Data fetching | Server Components first, React Query for client-side fetching, never `useEffect` |

### Infrastructure
| Concern | Choice |
|---|---|
| Cloud provider(s) | AWS — ECS Fargate + CloudFront + WAF, ECR, RDS |
| IaC tool | Terraform |
| IaC state backend | S3 bucket with DynamoDB lock table; one state file per environment |
| Secrets manager | AWS Systems Manager Parameter Store (SecureString) |
| CI/CD | GitHub Actions — lint+test+plan on PR; apply on merge to main (dev auto, staging/prod manual approval) |
| Database | PostgreSQL 16 (RDS) |
| Local Dev | Docker Compose — PostgreSQL 16, port 5432 |
| Task Automation | Makefile |
| Config | `.env` files (never committed); `.env.example` provided; backend via `ConfigService`; prod from Parameter Store via task definition |
| Observability | CloudWatch Logs (pino JSON) / CloudWatch Metrics (EMF) / AWS X-Ray (OpenTelemetry) |

### Security & Compliance
| Concern | Choice |
|---|---|
| Compliance frameworks | ISO 27001:2022 |
| Encryption at rest | Provider-managed AES-256 for RDS, S3, EBS; customer-managed KMS for confidential/pii data |
| Encryption in transit | TLS 1.2 minimum, TLS 1.3 preferred; HTTPS everywhere; HSTS |
| Data classification scheme | public / internal / confidential / pii |
| Vulnerability scanning | Dependabot (npm + Terraform providers), `npm audit --omit=dev` in CI, Trivy on container images |

---

## Repository Structure

```
converser/
├── backend/
│   └── src/
│       ├── config/
│       ├── common/
│       ├── database/
│       │   ├── entities/
│       │   └── migrations/
│       ├── auth/
│       │   ├── auth.controller.ts
│       │   ├── auth.service.ts
│       │   ├── auth.module.ts
│       │   └── dto/
│       ├── conversations/
│       │   ├── conversations.controller.ts
│       │   ├── conversations.service.ts
│       │   ├── conversations.module.ts
│       │   └── dto/
│       ├── people/
│       │   ├── people.controller.ts
│       │   ├── people.service.ts
│       │   ├── people.module.ts
│       │   └── dto/
│       ├── agents/
│       │   ├── agents.controller.ts
│       │   ├── agents.service.ts
│       │   ├── agents.module.ts
│       │   └── dto/
│       ├── themes/
│       │   ├── themes.controller.ts
│       │   ├── themes.service.ts
│       │   ├── themes.module.ts
│       │   └── dto/
│       └── reports/
│           ├── reports.controller.ts
│           ├── reports.service.ts
│           ├── reports.module.ts
│           └── dto/
├── frontend/
│   └── src/
│       ├── app/
│       ├── components/
│       │   ├── ui/
│       │   └── layout/
│       ├── store/
│       ├── lib/
│       └── hooks/
├── infra/
│   ├── modules/
│   │   ├── network/
│   │   ├── compute/
│   │   ├── data/
│   │   └── observability/
│   └── envs/
│       ├── dev/
│       ├── staging/
│       └── prod/
├── docs/
│   ├── proposals/
│   └── decisions/
├── scripts/
├── docker-compose.yml
├── Makefile
├── CLAUDE.md
└── README.md
```

---

## Architecture Rules

This project follows:

- The language-agnostic rules in
  [`RULES.md`](https://github.com/garethrhughes/skills/blob/main/RULES.md) (config &
  secrets, external HTTP clients, observability principles, IaC, testing, git & PRs).
- The **`typescript`** stack overlay in
  [`rules/typescript.md`](https://github.com/garethrhughes/skills/blob/main/rules/typescript.md)
  (language conventions, framework rules, ORM, logger, test runner).

**Project-specific additions / overrides:**
- All frontend components must follow the design system in [`STYLE_GUIDE.md`](./STYLE_GUIDE.md)
- Use semantic color tokens (`bg-surface`, `text-text-primary`, `border-border`) — never raw hex values or Tailwind's default palette (no `zinc-*`, `gray-*`, etc.)
- Icons: `lucide-react` only — no inline SVGs
- Dark mode: class-based (`.dark` on `<html>`), One Monokai inspired palette
- Border radius: `rounded-xl` for cards, `rounded-md`/`rounded-lg` for buttons/inputs, `rounded-full` for badges
- Shadows: `shadow-sm` at rest, `shadow-md` on hover with `transition-shadow`
- Cards use the pattern: `rounded-xl border border-border bg-surface p-4 shadow-sm`

---

## Security Rules (hard blocks)

Standard security rules are in `RULES.md` (no secrets in code, `ConfigService`-only
env access, parameterised queries, no `*` action on `*` resource, lockfile committed,
etc.).

**Project-specific additions:**
- Public (unauthenticated) endpoints: `GET /health` and `GET /api-docs` only
- Conversation content is classified as `confidential` — must be encrypted with customer-managed KMS at rest
- Person/Client data is classified as `confidential` — same encryption requirements

---

## External Integrations

| Service | Purpose | Auth | Rate Limits |
|---|---|---|---|
| Google Drive API | Conversation ingestion | OAuth 2.0 (user's Google token) | Per-user quota, 100 requests per 100 seconds |
| AWS Bedrock | AI agent invocation (parsing, categorisation) | IAM role (task role) | Model-specific token limits and throttling |
| Google OAuth 2.0 | Authentication (OIDC identity provider) | Client ID + secret | Standard Google rate limits |

---

## Domain Model

| Entity | Data Class |
|---|---|
| Conversation | confidential |
| Person/Client | confidential |
| Agent | internal |
| AgentInstruction | internal |
| Theme | internal |
| Category | internal |
| Report | internal |

---

## Testing Requirements

See [`RULES.md#testing`](../RULES.md#testing) for the canonical testing rules
(behaviour-focused names, no real network, services tested not controllers, IaC
modules tested, plan summary in PR description).

**Project-specific additions:**
_(none)_

---

## Design & Proposal Workflow

Write a proposal in `docs/proposals/NNNN-short-kebab-case-title.md` before implementing any:
- New module, service, or significant component
- Module boundary or data flow change
- New external API integration point
- Schema change affecting more than one entity
- Cross-cutting concern (caching, error handling strategy, etc.)
- New cloud resource type, network topology change, or new IAM role/policy with write/admin scope
- New secret, change to backup/retention, or change to the deployment pipeline

When a proposal is accepted, create the corresponding ADR in `docs/decisions/NNNN-title.md`
and update the proposal status to `Accepted`.

See the `architect` and `decision-log` skills for the exact proposal and ADR formats.

---

## Settled Decisions (do not revisit without a superseding ADR)

| # | Decision |
|---|---|
| 1 | Use PostgreSQL 16 as the primary data store |
| 2 | Google OAuth 2.0 (OIDC) for authentication |
| 3 | AWS Bedrock for AI agent invocation |
| 4 | Google Drive as initial conversation source |
| 5 | Terraform over OpenTofu |
| 6 | SSM Parameter Store over Secrets Manager |
| 7 | ISO 27001:2022 compliance |
| 8 | Agent instructions are user-configurable (not hard-coded) |

---

## Edge Cases & Gotchas

- Google Drive API rate limits (quota per 100 seconds per user) — requires backoff and queuing for bulk ingestion
- Bedrock token limits per invocation — large conversations may exceed model context windows; chunking strategy needed
- Partial ingestion failures — some files may succeed while others fail; need idempotent retry mechanism
- Timezone handling on conversation timestamps — store as UTC, display in user's local timezone
- PII in conversation content — conversations classified as confidential; ensure no PII leaks into logs or error messages
- Idempotency on retried mutations — Bedrock calls and Drive ingestion must be safe to retry
