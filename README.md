# Converser

A tool to ingest conversations (initially from Google Drive), parse them with custom AI agents (via AWS Bedrock), categorise and report on themes. Conversations are organised by People/Clients.

## Prerequisites

- Node.js 20+ (LTS)
- npm 10+
- Docker + Docker Compose
- Terraform 1.5+ (for infrastructure)
- AWS CLI v2 (for deployment)

## Quick Start

```bash
# 1. Copy environment templates
cp backend/.env.example backend/.env    # then fill in [REQUIRED] values
cp frontend/.env.example frontend/.env

# 2. Start local dependencies (PostgreSQL)
make up

# 3. Install dependencies (skip if already done)
cd backend && npm install && cd ..
cd frontend && npm install && cd ..

# 4. Run database migrations
make migrate

# 5. Start the apps
make dev-api   # in one terminal
make dev-web   # in another terminal
```

The backend API will be available at http://localhost:3001.
The frontend will be available at http://localhost:3000.
API docs (Swagger) at http://localhost:3001/api-docs.

## Available Commands

| Command | Description |
|---|---|
| `make up` | Start local dependencies (PostgreSQL via Docker Compose) |
| `make down` | Stop local dependencies |
| `make dev-api` | Run the backend in dev mode (watch) |
| `make dev-web` | Run the frontend in dev mode |
| `make test-api` | Run backend test suite (Jest) |
| `make test-web` | Run frontend test suite (Vitest) |
| `make lint-api` | Lint backend code (ESLint) |
| `make lint-web` | Lint frontend code (ESLint) |
| `make build-api` | Build backend for production |
| `make build-web` | Build frontend for production |
| `make migrate` | Run TypeORM database migrations |
| `make plan` | Run Terraform plan (dev environment) |
| `make apply` | Apply Terraform changes (dev environment) |

## Architecture

Converser is a monorepo with a NestJS backend (TypeScript, PostgreSQL + TypeORM) and a Next.js 16 frontend (React 19, Tailwind CSS v4, Zustand). Infrastructure is managed with Terraform on AWS (ECS Fargate, RDS, CloudFront).

## Documentation

- [`CLAUDE.md`](./CLAUDE.md) — authoritative project context, conventions, and rules
- [`docs/proposals/`](./docs/proposals/) — design proposals
- [`docs/decisions/`](./docs/decisions/) — architecture decision records (ADRs)

## Contributing

This project follows the conventions in [`CLAUDE.md`](./CLAUDE.md), which references the canonical engineering rules. Please read it before opening a PR.
