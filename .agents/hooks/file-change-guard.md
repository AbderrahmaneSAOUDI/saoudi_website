---
name: file-change-guard
description: Validates file modifications don't violate architecture rules before committing changes.
trigger: file_change
---

# File Change Guard

## Rules by File Path

### `astro.config.mjs`
- `output` must remain `'server'` — never change to `'static'` or `'hybrid'`
- `adapter` must remain `vercel()`
- `react()` must remain in `integrations`
- `tailwindcss()` must remain in `vite.plugins`

### `src/pages/*.astro` (Public Pages)
- Must NOT contain `client:load`, `client:visible`, `client:idle`, or `client:only`
- Must NOT import Firebase Client SDK (`firebase/app`, `firebase/firestore`)
- Must NOT contain `<script>` tags (except minimal inline `atob()`)
- Should use `BaseLayout` wrapper
- Should set `Cache-Control` header for Vercel Edge caching

### `src/pages/admin/*.astro` (Admin Pages)
- Must use `BackgroundBaseLayout` wrapper
- Should include auth check in frontmatter
- File names must have `admin_` prefix

### `src/middleware.ts`
- Must always exempt `/admin/admin_login` from auth checks
- Must read `admin_session` cookie
- Must call `verifySessionToken()` from session module
- Must set `Astro.locals.adminEmail` on success

### `src/types.ts`
- Changes must be reflected in README.md schema section
- Zod schemas must match TypeScript interfaces

### `src/styles/global.css`
- Must import Tailwind v4: `@import "tailwindcss"`
- Must contain `@theme {}` block with Google brand color tokens
- Must import `background_animation.css`

### `.env` / `.env.example`
- `.env` must NEVER be committed (check `.gitignore`)
- `.env.example` should list all required variables without real values

### `package.json`
- Never add animation libraries (framer-motion, gsap, animate.css, lottie)
- Never add masonry layout libraries
- Never switch from pnpm to npm/yarn
