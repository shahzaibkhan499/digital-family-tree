#!/usr/bin/env bash
set -euo pipefail

echo "Digital Family Tree - Project Setup"
echo "===================================="

# Check prerequisites
command -v node >/dev/null 2>&1 || { echo "Error: node is required" >&2; exit 1; }
command -v pnpm >/dev/null 2>&1 || { echo "Error: pnpm is required" >&2; exit 1; }

NODE_VERSION=$(node -v)
PNPM_VERSION=$(pnpm -v)

echo "Node version: $NODE_VERSION"
echo "pnpm version: $PNPM_VERSION"

# Install dependencies
echo ""
echo "Installing dependencies..."
pnpm install

# Copy env files if they don't exist
if [ ! -f apps/api/.env.local ]; then
  echo "Creating apps/api/.env.local from .env..."
  cp apps/api/.env apps/api/.env.local 2>/dev/null || true
fi

# Start dev services (databases)
echo ""
echo "Starting development databases..."
docker compose -f docker/docker-compose.dev.yml up -d

echo ""
echo "Setup complete!"
echo ""
echo "Available commands:"
echo "  pnpm dev          - Start all apps in development mode"
echo "  pnpm build        - Build all apps and packages"
echo "  pnpm lint         - Lint all packages"
echo "  pnpm format       - Format code with Prettier"
echo ""
echo "Individual apps:"
echo "  pnpm --filter @digital-family-tree/web dev   - Web app (port 4001)"
echo "  pnpm --filter @digital-family-tree/api dev   - API (port 4000)"
echo "  pnpm --filter @digital-family-tree/admin dev  - Admin (port 4002)"
