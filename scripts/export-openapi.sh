#!/bin/sh
# Regenerate frontend/openapi.json from the backend code (no database needed), then the
# TypeScript types. Used locally and by CI's drift check.
set -eu
cd "$(dirname "$0")/../../backend"
APP_ENV=local \
DATABASE_URL=postgresql+asyncpg://openapi:openapi@localhost:1/openapi \
JWT_SECRET=openapi-export-only-not-a-secret-0123456789 \
STORAGE_ENDPOINT_URL=http://localhost:8333 STORAGE_ACCESS_KEY_ID=x STORAGE_SECRET_ACCESS_KEY=x \
STORAGE_BUCKET=media STORAGE_PUBLIC_BASE_URL=http://localhost:8333/media \
  uv run --frozen python -m app.cli openapi > ../frontend/openapi.json
cd ../frontend
npx openapi-typescript openapi.json -o src/types/api.generated.ts
