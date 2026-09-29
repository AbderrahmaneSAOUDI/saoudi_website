#!/usr/bin/env bash
# Universal Test Daemon Runner
# Detects project test/check command and runs in watch mode or verification loop.

if [ -f "pnpm-lock.yaml" ]; then
  pnpm run check
elif [ -f "package.json" ]; then
  pnpm run check 2>/dev/null || npm test -- --watch
elif [ -f "pubspec.yaml" ]; then
  flutter test
elif [ -f "pyproject.toml" ] || [ -f "pytest.ini" ]; then
  pytest -f
elif [ -f "Cargo.toml" ]; then
  cargo test
else
  echo "No recognized test runner found."
fi
