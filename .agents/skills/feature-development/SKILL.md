---
name: feature-development
description: Guided workflow for designing, scaffolding, implementing, and validating new features.
---

# Feature Development Runbook

Follow this standard procedure when building a new capability or service.

## 1. Architecture Alignment
- Identify the target layer according to project conventions:
  - UI Component -> `src/components/` (PascalCase `.astro` or `.tsx`)
  - Screen/View -> `src/pages/` (`admin_` prefix for admin pages)
  - Domain Model -> `src/types.ts`
  - Service/IO -> `src/lib/server/`
  - Utilities -> `src/lib/`
- Ensure decoupling: do not mix direct client database mutations inside public SSR templates.

## 2. Implementation Steps
1. Scaffold models and Zod contract interfaces in `src/types.ts` first.
2. Implement backend/service integration in `src/lib/server/` with defensive error handling.
3. Construct presentation views using reusable atomic components.
4. Verify build and static checks (`pnpm run check && pnpm run build`).
