---
trigger: always_on
description: Universal file naming conventions, modularity standards, and Single Responsibility Principle.
---

# File Naming & Project Modularity Standards

## 1. Single Responsibility Principle (SRP)
- **One File, One Concern**: Each file must encapsulate exactly one module, class, widget, or function set.
- **Modularity over File Size**: Prefer creating clean, smaller focused files over giant multi-purpose classes. If a file exceeds 300 lines, evaluate splitting helper classes or sub-components.
- **No Junk-Drawer Files**: Never create files like `helpers.ts`, `common_utils.py`, or `misc.dart` containing unrelated functions. Group utilities strictly by domain (e.g., `formatting_utils`, `currency_math`).

## 2. Universal File Naming Invariants
- Use consistent lowercase casing with separators matching the language ecosystem (`kebab-case` for Web/TypeScript, `snake_case` for Python/Dart/Rust/Go).
- Use clear architectural prefixes to make file purposes identifiable at a glance:
  - `c_*` or `*Component`: Reusable atomic UI components.
  - `view_*` or `*Screen` / `*Page`: Full screen views and page routes.
  - `mod_*` or `*Model`: Data transfer objects, entity definitions, and schemas.
  - `srv_*` or `*Service`: External API clients, database adapters, and hardware IO.
  - `vm_*` or `*Controller` / `*Provider`: State machines and presentation logic.
  - `t_*` or `*.test.*` / `*_test.*`: Automated test suites.

## 3. Colocation & Clean Export Invariants
- Place test files adjacent to their source implementation (or in a mirrored `test/` tree maintaining identical relative paths).
- Maintain clean barrel exports (`index.ts`, `index.js`, or library exports) where applicable to prevent deep relative `../../..` import paths.
