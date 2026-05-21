.PHONY: start stop up down dev-api dev-web test-api test-web lint-api lint-web build-api build-web migrate plan apply

# Start everything (docker + backend + frontend)
start:
	docker compose up -d
	cd backend && npm run start:dev &
	cd frontend && npm run dev &

# Stop everything
stop:
	-pkill -f "nest start" 2>/dev/null || true
	-pkill -f "next dev" 2>/dev/null || true
	docker compose down

# Local dependencies
up:
	docker compose up -d

down:
	docker compose down

# Development
dev-api:
	cd backend && npm run start:dev

dev-web:
	cd frontend && npm run dev

# Testing
test-api:
	cd backend && npm run test

test-web:
	cd frontend && npx vitest run

# Linting
lint-api:
	cd backend && npm run lint

lint-web:
	cd frontend && npm run lint

# Build
build-api:
	cd backend && npm run build

build-web:
	cd frontend && npm run build

# Database migrations
migrate:
	cd backend && npm run migration:run

# Infrastructure
plan:
	cd infra/envs/dev && terraform plan

apply:
	cd infra/envs/dev && terraform apply
