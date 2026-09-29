---
name: verification-and-release
description: Standard pre-flight checklist, test runner, lint validation, and git release flow for any project.
---

# Universal Verification & Release Runbook

Execute this runbook before tagging releases, completing major features, or opening PRs.

## 1. Targeted Quality Checks
1. **Linter & Type Check**:
   - Node.js: `npm run lint` or `npx tsc --noEmit`
   - Python: `ruff check` or `mypy .`
   - Dart/Flutter: `dart analyze` or `flutter analyze`
   - Rust: `cargo check`
2. **Automated Unit Tests**:
   - Run impacted test suite: ensure 100% pass rate with zero regression.

## 2. Version Verification
- Verify the active version identifier in `package.json`, `pubspec.yaml`, `pyproject.toml`, or `Cargo.toml`.
- Ensure version bump adheres to `versioning-and-git.md`.

## 3. Git Release Preparation
1. Check untracked files: `git status --short`. Ensure no temporary logs, keys, or scratch artifacts are staged.
2. Stage modified files atomically: `git add <specific files>`.
3. Create signed or annotated commit:
   `git commit -m "<VERSION> - <type>(<scope>): <summary>"`
