# Project Engineering Standards & Agent Operational Contract

This document defines the strict operational contract, engineering standards, and efficiency guidelines for all AI agents working in this repository.

---

## 1. High-Performance Execution & Parallel Tool Use
- **Parallel Lookups**: Emit all independent `view_file` or search tool calls concurrently in the same turn. Never read files sequentially across multiple turns.
- **Strict Prohibition on Re-Reading**: Once a file has been read in the conversation trajectory, NEVER re-read it. Its contents are already in context.
- **No Self-Verification Re-Reads**: Do NOT call `view_file` after modifying a file just to "verify" the file write. Trust tool feedback.
- **Atomic Batch Editing**: Plan cross-file edits upfront and apply them together in a single turn using `replace_file_content` or `write_to_file`.
- **Zero-Polling**: Never poll `manage_task(Action='status')` in a loop. Background commands notify you automatically upon completion. Set `WaitMsBeforeAsync` appropriately (10000ms+) for synchronous linter/test completion.
- **Targeted Verification**: Run tests and lint checks only against modified files (e.g., `npm test -- path/to/test`, `flutter test test/specific_test.dart`, `pytest tests/test_specific.py`) rather than triggering full repository rebuilds for localized changes.

---

## 2. File Naming & Modularity Standards
- **Naming Casing**: Use consistent lowercase with separators appropriate for this stack (`kebab-case` for Web/TS, `snake_case` for Dart/Python/Rust/Go).
- **Prefixes by Architectural Layer**:
  - `c_*` / `*Component`: Reusable atomic UI elements.
  - `view_*` / `*Screen` / `*Page`: Top-level screens and page layouts.
  - `mod_*` / `*Model`: Data models, schemas, and DTOs.
  - `srv_*` / `*Service`: IO, database adapters, and external APIs.
  - `vm_*` / `*Controller`: Business logic and state management.
  - `t_*` / `*_test.*`: Automated unit and integration tests.
- **Single Responsibility Principle**: One module or component per file. Avoid giant kitchen-sink files (`utils.ts`, `helpers.py`); group helpers strictly by domain.

---

## 3. Versioning & Commit Protocol
- **Format**: `MAJOR.MINOR.PATCH` (in `package.json`, `pubspec.yaml`, `pyproject.toml`, or `Cargo.toml`).
- **Auto-Increment**:
  - Increment `PATCH` by `1` automatically on completion of any task modifying code, assets, or configs.
  - If no code or configuration was altered (e.g. read-only chat or questions), skip version bumping entirely.
- **Silent Update**: Update version files silently without narrating the bump in user conversation.
- **Conventional Commits**: Format commits with version prefix:
  `[VERSION] - <type>(<scope>): <concise message>`

---

## 4. Clean Code & Non-Destructive Refactoring
- **Preserve Documentation**: Maintain all pre-existing comments, docstrings, and license headers.
- **Separation of Concerns**: Keep business logic completely decoupled from view layer presentation.
- **Defensive Error Handling**: Catch specific exceptions and avoid swallowing errors silently.
- **Lifecycle Cleanliness**: Properly dispose and cancel all event listeners, controllers, and streams.
