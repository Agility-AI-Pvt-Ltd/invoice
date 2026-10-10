#!/usr/bin/env bash
# Build the web image and push to Amazon ECR.
# Usage (from repo root):
#   export AWS_REGION=ap-south-1
#   export AWS_ACCOUNT_ID=429965275836
#   export ECR_REPOSITORY=invoicely-prod
#   export NEXT_PUBLIC_APP_URL=https://invoice.yourdomain.com
#   ./deploy/push-ecr.sh
# Optional: IMAGE_TAG=v1.2.3 (default: latest)

set -euo pipefail

AWS_REGION="${AWS_REGION:-ap-south-1}"
AWS_ACCOUNT_ID="${AWS_ACCOUNT_ID:?Set AWS_ACCOUNT_ID}"
ECR_REPOSITORY="${ECR_REPOSITORY:-invoicely-prod}"
IMAGE_TAG="${IMAGE_TAG:-latest}"
NEXT_PUBLIC_APP_URL="${NEXT_PUBLIC_APP_URL:?Set NEXT_PUBLIC_APP_URL}"

ECR_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
ECR_IMAGE="${ECR_REGISTRY}/${ECR_REPOSITORY}:${IMAGE_TAG}"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "→ Ensuring ECR repository exists: ${ECR_REPOSITORY}"
aws ecr describe-repositories --repository-names "$ECR_REPOSITORY" --region "$AWS_REGION" 2>/dev/null \
  || aws ecr create-repository --repository-name "$ECR_REPOSITORY" --region "$AWS_REGION"

echo "→ Logging in to ECR (${ECR_REGISTRY})"
aws ecr get-login-password --region "$AWS_REGION" \
  | docker login --username AWS --password-stdin "$ECR_REGISTRY"

echo "→ Building ${ECR_IMAGE}"
docker build \
  --build-arg NEXT_PUBLIC_APP_URL="$NEXT_PUBLIC_APP_URL" \
  -t "$ECR_IMAGE" \
  .

echo "→ Pushing ${ECR_IMAGE}"
docker push "$ECR_IMAGE"

echo "Done. Set on EC2 .env:"
echo "  ECR_IMAGE=${ECR_IMAGE}"
