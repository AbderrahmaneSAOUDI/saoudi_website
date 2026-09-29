---
trigger: always_on
description: Universal high-speed agent execution, parallel tool use, and low-latency workflows.
---

# Agent Speed & Execution Efficiency

## 1. Parallel Tool Calling & Batching
- **Simultaneous Lookups**: When multiple files, directories, or symbols need inspection, emit all `view_file` or search calls concurrently in the SAME turn. Never inspect files sequentially across multiple turns.
- **Strict Prohibition on Re-Reading**: Once a file has been read in the conversation trajectory, NEVER call `view_file` on it again. Its content is already in your context.
- **No Self-Verification Re-Reads**: Do NOT call `view_file` immediately after editing a file to "verify" the edit. Trust your editor tool output unless a compiler error explicitly indicates the file failed to update.

## 2. Single-Pass Batch Editing
- Plan all necessary file changes upfront across the codebase and apply them in a single batch turn using `replace_file_content` or `write_to_file`.
- Avoid making tiny 2-line edits followed by immediate re-reads and questions.

## 3. Zero-Polling Policy
- NEVER poll background task status in a loop (e.g., repeatedly calling `manage_task(Action='status')`).
- Background commands notify you automatically upon completion. For short build checks and linters, set `WaitMsBeforeAsync` appropriately (10000ms+) so they complete synchronously.

## 4. Diagnostic Loop Breaker
- If the IDE or analyzer reports diagnostics/lints after an edit, fix all legitimate issues in ONE single batch pass.
- Do NOT enter multi-turn ping-pong loops over minor cosmetic or stylistic lints when the core implementation works.

## 5. Targeted Verification
- Run compiler/lint checks or test suites ONLY on modified files (e.g. `npm test -- path/to/test`, `flutter test test/specific_test.dart`, `pytest tests/test_specific.py`) rather than triggering heavy full-suite builds for localized edits.
