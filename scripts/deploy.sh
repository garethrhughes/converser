#!/usr/bin/env bash
set -euo pipefail

# =============================================================================
# Converser — Build, Push & Deploy Script
#
# Usage:
#   ./scripts/deploy.sh                    # Build, push, and apply Terraform
#   ./scripts/deploy.sh --build-only       # Build and push images only
#   ./scripts/deploy.sh --apply-only       # Apply Terraform only (no build)
#
# Prerequisites:
#   - AWS CLI configured with appropriate credentials
#   - Docker running
#   - Terraform installed
#   - ECR_REPOSITORY_URL environment variable set (or passed via --ecr-url)
#
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
INFRA_DIR="$ROOT_DIR/infra/envs/prod"

# Defaults
AWS_REGION="${AWS_REGION:-eu-west-1}"
IMAGE_TAG="${IMAGE_TAG:-$(git -C "$ROOT_DIR" rev-parse --short HEAD)}"
ECR_REPOSITORY_URL="${ECR_REPOSITORY_URL:-}"
BUILD_ONLY=false
APPLY_ONLY=false

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --build-only)
      BUILD_ONLY=true
      shift
      ;;
    --apply-only)
      APPLY_ONLY=true
      shift
      ;;
    --ecr-url)
      ECR_REPOSITORY_URL="$2"
      shift 2
      ;;
    --tag)
      IMAGE_TAG="$2"
      shift 2
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Validate
if [[ -z "$ECR_REPOSITORY_URL" && "$APPLY_ONLY" != "true" ]]; then
  echo "ERROR: ECR_REPOSITORY_URL is not set."
  echo "  Set it via: export ECR_REPOSITORY_URL=123456.dkr.ecr.eu-west-1.amazonaws.com/converser"
  echo "  Or pass: --ecr-url <url>"
  exit 1
fi

# Extract ECR registry from repository URL (everything before the first /)
ECR_REGISTRY="${ECR_REPOSITORY_URL%%/*}"

echo "========================================="
echo " Converser Deploy"
echo "========================================="
echo " Region:     $AWS_REGION"
echo " Image tag:  $IMAGE_TAG"
echo " ECR URL:    $ECR_REPOSITORY_URL"
echo " Mode:       $(if $BUILD_ONLY; then echo 'build-only'; elif $APPLY_ONLY; then echo 'apply-only'; else echo 'full'; fi)"
echo "========================================="
echo ""

# ─── Build & Push ─────────────────────────────────────────────────────────────

if [[ "$APPLY_ONLY" != "true" ]]; then
  echo "→ Authenticating with ECR..."
  aws ecr get-login-password --region "$AWS_REGION" | docker login --username AWS --password-stdin "$ECR_REGISTRY"

  echo ""
  echo "→ Building backend image..."
  docker build \
    --platform linux/amd64 \
    -t "$ECR_REPOSITORY_URL:backend-$IMAGE_TAG" \
    -t "$ECR_REPOSITORY_URL:backend-latest" \
    "$ROOT_DIR/backend"

  echo ""
  echo "→ Building frontend image..."
  docker build \
    --platform linux/amd64 \
    --build-arg NEXT_PUBLIC_API_URL="https://converser.ops.mypassglobal.com" \
    -t "$ECR_REPOSITORY_URL:frontend-$IMAGE_TAG" \
    -t "$ECR_REPOSITORY_URL:frontend-latest" \
    "$ROOT_DIR/frontend"

  echo ""
  echo "→ Pushing backend image..."
  docker push "$ECR_REPOSITORY_URL:backend-$IMAGE_TAG"
  docker push "$ECR_REPOSITORY_URL:backend-latest"

  echo ""
  echo "→ Pushing frontend image..."
  docker push "$ECR_REPOSITORY_URL:frontend-$IMAGE_TAG"
  docker push "$ECR_REPOSITORY_URL:frontend-latest"

  echo ""
  echo "✓ Images built and pushed successfully"
  echo "  Backend:  $ECR_REPOSITORY_URL:backend-$IMAGE_TAG"
  echo "  Frontend: $ECR_REPOSITORY_URL:frontend-$IMAGE_TAG"
fi

# ─── Terraform Apply ──────────────────────────────────────────────────────────

if [[ "$BUILD_ONLY" != "true" ]]; then
  echo ""
  echo "→ Running Terraform..."
  cd "$INFRA_DIR"

  terraform init -input=false

  echo ""
  echo "→ Terraform plan..."
  terraform plan \
    -var="backend_image_tag=backend-$IMAGE_TAG" \
    -var="frontend_image_tag=frontend-$IMAGE_TAG" \
    -out=tfplan

  echo ""
  read -p "Apply this plan? (y/n) " -n 1 -r
  echo ""

  if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "→ Applying..."
    terraform apply tfplan
    rm -f tfplan

    echo ""
    echo "✓ Terraform applied successfully"
    echo ""
    echo "→ Forcing new ECS deployment..."
    CLUSTER_NAME=$(terraform output -raw ecs_cluster_name)
    aws ecs update-service --cluster "$CLUSTER_NAME" --service "converser-backend-prod" --force-new-deployment --region "$AWS_REGION" > /dev/null
    aws ecs update-service --cluster "$CLUSTER_NAME" --service "converser-frontend-prod" --force-new-deployment --region "$AWS_REGION" > /dev/null

    echo "✓ ECS services redeployed"
  else
    echo "Aborted."
    rm -f tfplan
    exit 0
  fi
fi

echo ""
echo "========================================="
echo " Deploy complete!"
echo "========================================="
