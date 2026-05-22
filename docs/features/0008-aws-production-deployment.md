# 0008 — AWS Production Deployment

**Date:** 2026-05-22
**Status:** In Progress
**Source:** Manual
**Related proposal:** docs/proposals/0008-aws-production-deployment.md

## Summary

Deploy Converser to AWS as a single production environment. Frontend and backend run as separate ECS Fargate services behind CloudFront and an ALB. PostgreSQL 16 on RDS. Domain: `converser.ops.mypassglobal.com`.

## Background / Motivation

The application currently runs locally via Docker Compose. A production deployment is needed so the application is accessible to users over the internet with proper TLS, managed database, and container orchestration.

## Scope

**In scope**
- Terraform IaC under `infra/envs/prod/`
- ECS Fargate services (frontend + backend, separate tasks)
- ALB with path-based routing
- CloudFront distribution with ACM TLS certificate
- RDS PostgreSQL 16 (db.t4g.micro, encrypted with KMS)
- SSM Parameter Store for secrets
- Route 53 DNS record (`converser.ops.mypassglobal.com`)
- ECS task IAM roles (Bedrock invoke, SSM read, CloudWatch logs)
- Security groups (ALB, ECS, RDS)
- Private subnets for RDS and ECS, public subnets for ALB
- Health check endpoint on backend

**Out of scope**
- CI/CD pipeline (manual deployment for now)
- WAF rules (future enhancement)
- Multi-environment (staging/dev) — production only
- Auto-scaling policies beyond ECS defaults
- Bastion host or VPN for DB access

## Acceptance Criteria

- Application accessible at `https://converser.ops.mypassglobal.com`
- Backend API routed via path-based routing on ALB
- Frontend and backend are separate ECS Fargate services
- PostgreSQL 16 on RDS with KMS encryption at rest
- Secrets stored in SSM Parameter Store
- TLS certificate provisioned via ACM (DNS validation)
- Infrastructure defined in Terraform under `infra/envs/prod/`
- Health check endpoint works for ALB target group
- Uses existing VPC, IGW, hosted zone, and ECR repository
- ECS task role has `bedrock:InvokeModel` permission scoped to the model ARN

## Open Questions

None.

## Notes

- Existing resources: VPC with IGW, `ops.mypassglobal.com` Route 53 hosted zone, ECR repository
- Single production environment — no staging/dev separation
- Manual deployment via `terraform apply` for now
- Frontend served as a Next.js standalone build in a container
- Backend served as a NestJS build in a container
