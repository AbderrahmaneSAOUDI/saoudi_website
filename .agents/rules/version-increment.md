---
trigger: always_on
---
# Version Increment Rule

## Automatic Version Bump

- **Universal Scope**: This rule applies strictly to all AI agents (Gemini, Claude, Trae, Devin, Cursor, Windsurf, Copilot, etc.).
- **Minor Version Automation**: The minor version (the second number in `1.X.Y`) represents the number of days elapsed since project creation on **June 1, 2026** (`2026-06-01`).
  - Formula: `Minor Version = floor((Current Date - 2026-06-01) in days)`.
  - Example: On August 5, 2026, 65 days have passed since June 1, 2026, so the minor version is `65` (`1.65.Y`).
  - Always ensure the minor version reflects the calculated days for the current date.
- **Patch Version Bump**: Every time any AI agent receives a new prompt/task, the patch version (the third number `Y` in `1.X.Y`) must be incremented by 1 strictly at the end of prompt/task processing (before completing the task/turn), NEVER at the beginning.
- **Silent Execution**: The AI agent must **NEVER** mention, report, or announce the version increment in its response/reply to the user. The version bump must be performed silently as a background task.
- **Example**: On June 1, 2026 (day 0), version starts at `1.0.0`. On August 5, 2026 (day 65), if `package.json` has `"version": "1.65.17"`, it updates to `"version": "1.65.18"`.
