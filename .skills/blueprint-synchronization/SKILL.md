---
name: blueprint-synchronization
description: Establishes a strict documentation mirror rule requiring synchronous updates to the canonical system files.
triggers:
  - "update readme"
  - "modify documentation"
  - "sync spec"
  - "change roadmap"
---

# Blueprint Synchronization

## System Context

`README.md` is the **single source of truth** for this project's architecture, data schema, roadmap, and visual rules. `GEMINI.md` serves as the AI-assistant configuration mirror. Both documents must remain perfectly synchronized with each other and with the actual codebase at all times.

**Architectural references:**

- `README.md` — canonical project specification
- `GEMINI.md` — AI-assistant guide (mirrors README content)

---

## Playbook

### 1 — Metadata Conformance

You are blocked from introducing structural database changes, renaming variables, or extending the literal type schemas of the platform unless you simultaneously update the architecture references, entity maps, and code context blocks across both `GEMINI.md` and `README.md` within the same cycle.

Commit checklist:

- [ ] Code changes implemented.
- [ ] TypeScript interfaces in `src/types.ts` match actual Firestore schema.
- [ ] `README.md` updated with structural changes or roadmap progress.
- [ ] `GEMINI.md` updated in exact sync with `README.md` modifications.

---

## Hard Guardrails

- **BANNED:** Making structural code changes without updating `README.md`.
- **BANNED:** Updating `README.md` without mirroring changes in `GEMINI.md`.
- **BANNED:** Adding new collections, routes, or env variables that aren't documented.
- **BANNED:** Implementing features not listed in the roadmap without adding them first.
- **BANNED:** Modifying TypeScript interfaces without updating the documentation schema blocks.
- **REQUIRED:** `README.md` and `GEMINI.md` must be updated in the same commit as structural code changes.
- **REQUIRED:** Roadmap checkboxes must be updated when features are completed.
