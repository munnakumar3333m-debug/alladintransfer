#!/bin/bash
set -e
REPO_ROOT="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$REPO_ROOT"
echo "Running from: $REPO_ROOT"
NODE_ENV=development npx pnpm@9 install --no-frozen-lockfile --strict-peer-dependencies=false
npx pnpm@9 --filter @workspace/admin-dashboard run build
mkdir -p dist
cp -r artifacts/admin-dashboard/dist/public/. dist
echo "Done!"
