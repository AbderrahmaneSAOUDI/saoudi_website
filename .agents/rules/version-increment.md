---
trigger: always_on
---
# Version Increment Rule

## Automatic Version Bump

- **Universal Scope**: This rule applies strictly to all AI agents (Gemini, Claude, Trae, Devin, Cursor, Windsurf, Copilot, etc.).
- **Requirement**: Every time any AI agent receives a new prompt/task (at the very beginning of the turn/run), the first action must be to increment the patch version of the application in `package.json` by 1.
- **Silent Execution**: The AI agent must **NEVER** mention, report, or announce the version increment in its response/reply to the user. The version bump must be performed silently as a background task.
- **Example**: If `"version": "1.0.4"` is in `package.json`, it must be updated to `"version": "1.0.5"`.
- **Constraint**: Only the patch number (the third digit) is modified. Do not touch or modify other numbers, version digits, dependencies, or configuration settings.
