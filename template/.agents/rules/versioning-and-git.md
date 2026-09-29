---
trigger: always_on
description: Universal automatic version increment, git commit formatting, and release rules.
---

# Automated Versioning & Git Protocol

## 1. Version Format Specification
All projects follow the SemVer triad (`MAJOR.MINOR.PATCH`):
- **MAJOR (`X.0.0`)**: Incremented only on major architectural overhauls or breaking public API changes.
- **MINOR (`1.X.0`)**: Incremented when new features are added (or dynamically calculated using elapsed days for rapid projects).
- **PATCH (`1.0.X`)**: Incremented by `1` automatically whenever changes to code, configurations, or assets are completed.
  - Resets to `0` when a new MINOR release is tagged.

## 2. Operational Invariants
1. **Conditional Execution**: ONLY bump version files (`pubspec.yaml`, `package.json`, `pyproject.toml`, `Cargo.toml`, `VERSION`) if code, assets, or tests were actually modified. Never trigger a version bump for pure chat inquiries or read-only tasks.
2. **Silent Execution**: Never ask user confirmation or boast in conversational output about updating the version number. Execute the bump silently before committing.
3. **Atomic Commit Protocol**:
   - Update the version file in the same turn before creating the git commit.
   - All commit messages must follow Conventional Commits with version tag:
     - Format: `<VERSION> - <type>(<scope>): <summary>`
     - Example: `1.2.4 - feat(auth): add token refresh retry policy`
