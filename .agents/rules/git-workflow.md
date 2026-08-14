---
trigger: always_on
---
# Git Workflow & Push Rule

## Mandatory End-of-Prompt Git Automation

- **Universal Scope**: This rule applies strictly and unconditionally to all AI agents (Gemini, Claude, Trae, Devin, Cursor, Windsurf, Copilot, Codex, etc.).
- **Commit Message Format Requirement**: Every commit message MUST start with the project version read from `package.json`, formatted as:
  `"<version> - <type>: <description>"` or `"<version> - <description>"`
  - **Example**: `git commit -m "1.74.349 - fix: description here"`
  - **Example**: `git commit -m "1.74.350 - chore: update agent rules"`
- **Requirement**: At the conclusion of processing every user prompt/task (after completing all code modifications, verification, and the silent version increment), every AI agent MUST execute the following sequence:
  1. `git add .` (stage all modified, added, and deleted files)
  2. `git commit -m "<version> - <summary>"` (commit with the version from `package.json` followed by a concise description)
  3. `git push` (push all commits to the remote branch)
- **Lifecycle Sequence at End of Prompt**:
  1. Verification (`pnpm run check` and `pnpm run build` when applicable)
  2. Silent Version Increment (`package.json` patch bump per `version-increment.md`)
  3. Read the resulting `"version"` from `package.json` (e.g., `1.74.350`)
  4. Git Stage: `git add .`
  5. Git Commit: `git commit -m "<version> - <description>"` (e.g., `git commit -m "1.74.350 - docs: update git commit message format rule"`)
  6. Git Push: `git push`
- **Constraint**: Do not omit `git push` at the end of any prompt turn unless there are no staged changes to commit.
