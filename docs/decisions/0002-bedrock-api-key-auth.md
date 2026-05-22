# 0002 — Bedrock API Key Auth over SDK Credential Chain

**Date:** 2026-05-22
**Status:** Accepted
**Deciders:** Architect Agent, Developer
**Proposal:** docs/proposals/0004-conversation-analysis-workflow.md

## Context

Converser needs to invoke AWS Bedrock for AI agent execution. The AWS SDK default credential chain (IAM roles, env vars) was initially used but requires IAM infrastructure. Bedrock now supports API key auth via Bearer tokens on the Converse API.

## Options Considered

### Option A — AWS SDK Credential Chain

Use the standard AWS SDK with IAM roles (in production) and access keys or profiles (in local dev). Requires configuring task roles on ECS, and developers need AWS credentials locally.

### Option B — Bedrock API Key with Bearer Token via HTTP

Use Bedrock's API key auth feature with direct HTTP calls to the Converse API endpoint. A single API key is stored in `.env` (locally) or Parameter Store (production) and passed as a Bearer token.

## Decision

Use Bedrock API key auth with direct HTTP calls to the Converse API endpoint, rather than the AWS SDK.

## Rationale

Simpler local dev setup (single API key in `.env`), no AWS SDK dependency (removed 41 packages), works identically in dev and prod without IAM role configuration. API key can be rotated independently.

## Consequences

- **Positive:** Zero AWS SDK dependencies, simpler deployment, no IAM role configuration needed for Bedrock access.
- **Negative / trade-offs:** Must manage API key rotation manually rather than relying on automatic credential rotation via IAM roles.
- **Risks:** API key feature is newer — monitor for AWS changes to the auth mechanism or deprecation notices.
