#!/bin/bash
set -e
echo "=== INSTALLING ==="
NODE_ENV=development npx pnpm@9 install --no-frozen-lockfile --strict-peer-dependencies=false
echo "=== BUILDING ==="
npx pnpm@9 --filter @workspace/admin-dashboard run build
echo "=== COPYING ==="
mkdir -p dist
cp -r artifacts/admin-dashboard/dist/public/. dist
echo "=== DONE ==="
