---
trigger: always_on
---
# Git Workflow & Push Rule

## Mandatory End-of-Prompt Git Automation

- **Universal Scope**: This rule applies strictly and unconditionally to all AI agents (Gemini, Claude, Trae, Devin, Cursor, Windsurf, Copilot, Codex, etc.).
- **Commit Message Format Requirement**: Every commit message MUST start with `updated project version` (e.g., `git commit -m "updated project version to 1.X.Y - <concise description of changes>"` or `git commit -m "updated project version: <concise description of changes>"`).
- **Requirement**: At the conclusion of processing every user prompt/task (after completing all code modifications, verification, and the silent version increment), every AI agent MUST execute the following sequence:
  1. `git add .` (stage all modified, added, and deleted files)
  2. `git commit -m "updated project version: <concise descriptive summary of changes>"` (commit with a message starting with "updated project version" followed by what happened)
  3. `git push` (push all commits to the remote branch)
- **Lifecycle Sequence at End of Prompt**:
  1. Verification (`pnpm run check` and `pnpm run build` when applicable)
  2. Silent Version Increment (`package.json` patch bump per `version-increment.md`)
  3. Git Stage: `git add .`
  4. Git Commit: `git commit -m "updated project version: <what happened here>"`
  5. Git Push: `git push`
- **Constraint**: Do not omit `git push` at the end of any prompt turn unless there are no staged changes to commit.
