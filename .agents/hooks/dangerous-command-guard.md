---
name: dangerous-command-guard
description: Intercepts and blocks potentially destructive commands that could break the project.
trigger: command
---

# Dangerous Command Guard

## Blocked Commands

### Package Manager Violations

- `npm install` / `npm i` → **BLOCK** — use `pnpm add` instead
- `yarn add` → **BLOCK** — use `pnpm add` instead
- `npx` without `pnpm dlx` consideration → **WARN**

### Destructive Operations

- `rm -rf node_modules` → **WARN** — suggest `pnpm install` to rebuild instead
- `rm -rf dist` → **ALLOW** — build output can be safely deleted
- `rm -rf .astro` → **ALLOW** — generated types, safe to delete
- `rm -rf src` → **BLOCK** — never delete source directory
- `rm .env` → **BLOCK** — never delete environment config

### Build Mistakes

- `astro build --output static` → **BLOCK** — must remain SSR
- Adding `output: 'static'` or `output: 'hybrid'` to astro.config → **BLOCK**

### Dependency Additions to Block

- `pnpm add framer-motion` → **BLOCK** — banned animation library
- `pnpm add gsap` → **BLOCK** — banned animation library
- `pnpm add @tanstack/react-query` → **BLOCK** on public routes
- `pnpm add swr` → **BLOCK** on public routes
- `pnpm add firebase` without confirming admin-only usage → **WARN**

## Allowed Safe Commands

- `pnpm run dev` / `pnpm run build` / `pnpm run preview`
- `pnpm add <package>` (for non-blocked packages)
- `pnpm astro check`
- `git` operations
