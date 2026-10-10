#!/usr/bin/env bash
# On EC2: log in to ECR, pull latest image, restart the stack.
# Usage (from repo root on EC2, after .env is configured):
#   export AWS_REGION=ap-south-1
#   export AWS_ACCOUNT_ID=429965275836
#   ./deploy/ec2-pull-up.sh

set -euo pipefail

AWS_REGION="${AWS_REGION:-ap-south-1}"
AWS_ACCOUNT_ID="${AWS_ACCOUNT_ID:?Set AWS_ACCOUNT_ID}"
ECR_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ ! -f .env ]]; then
  echo "Missing .env in repo root. Copy deploy/env.production.example and fill in values."
  exit 1
fi

echo "→ ECR login"
aws ecr get-login-password --region "$AWS_REGION" \
  | docker login --username AWS --password-stdin "$ECR_REGISTRY"

echo "→ Pull and restart"
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d

echo "→ Status"
docker compose -f docker-compose.prod.yml ps
