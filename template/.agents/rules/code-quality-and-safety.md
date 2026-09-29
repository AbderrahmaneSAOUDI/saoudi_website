---
trigger: always_on
description: Universal safe refactoring, defensive coding, and documentation integrity rules.
---

# Code Quality & Non-Destructive Refactoring

## 1. Documentation & Code Integrity
- **Preserve Existing Comments**: Never strip existing comments, docstrings, or license headers from files unless explicitly tasked with rewriting documentation.
- **Preserve Coding Conventions**: Always respect the existing code style, spacing, formatting, and naming conventions of the host repository.

## 2. Defensive Engineering & Separation of Concerns
- **Decoupled Architecture**: Keep business rules, calculations, and data fetching decoupled from UI widgets or HTTP handlers.
- **Explicit Error Handling**: Always catch specific exceptions rather than broad empty try/catch blocks. Provide user-friendly, actionable feedback upon failure.
- **State & Lifecycle Guards**: Guard asynchronous UI callbacks (e.g. `if (!mounted) return;` in Flutter, unmounted cleanup in React `useEffect`). Properly dispose listeners, controllers, and streams.

## 3. Non-Destructive Modification
- When modifying configuration files (e.g. `package.json`, `pubspec.yaml`, Dockerfiles), preserve all existing dependency declarations and scripts; only append or update the exact required keys.
