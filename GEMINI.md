# saoudi.online — GEMINI.md

## Project Overview
`saoudi.online` is the personal portfolio and admin content-management system for Abderrahmane SAOUDI. It delivers a fast, Material 3 dark-mode, zero-JavaScript public website powered by Astro SSR, paired with a protected admin workspace for real-time Firestore/Storage content management and system telemetry.

## Tech Stack
- **Framework:** Astro v6 (`output: 'server'` SSR mode) with `@astrojs/vercel` adapter.
- **Language & Runtime:** TypeScript (strict mode `astro/tsconfigs/strict`), Node.js (≥22.12.0).
- **Styling:** Tailwind CSS v4 (`@tailwindcss/vite`), Vanilla CSS (`src/styles/global.css`, `background_animation.css`), self-hosted Google Sans fonts (`/public/fonts/`).
- **Database & Storage:** Firebase Admin SDK v14 (`firebase-admin` for Firestore & Firebase Storage).
- **Authentication:** Google Identity Services (GSI) OAuth (`google-auth-library`) with HMAC-SHA256 signed session cookies (`admin_session`, 7-day expiry).
- **Data Validation:** Zod v4 schemas (`src/types.ts`).
- **Package Manager:** `pnpm` exclusively (v11+).

## Architecture & Structure
- **Zero-JS Public Pages (`src/pages/*.astro`):** Server-rendered Astro pages (`/`, `/projects`, `/experience`, `/designs`, `/certifications`, `/services`, `/resume`). Public data is fetched exclusively in Astro frontmatter via `firebase-admin` and in-memory caching (`src/lib/server/cache.ts`). Renders zero client-side JavaScript to visitors.
- **Astro Server Islands (`server:defer`):** Heavy portfolio sections use deferred Server Islands with `<SkeletonCardGrid slot="fallback" />` to stream initial HTML instantly.
- **Protected Admin Area (`src/pages/admin/admin_*.astro`):** Isolated admin workspace following a 66%/33% Master-Detail UI layout (`AdminLayout.astro`, `AdminNavDock.astro`, `AdminHeader.astro`). Guarded by `src/middleware.ts`.
- **Server Utilities (`src/lib/server/`):**
  - `firebase-admin.ts`: Singleton Firebase Admin App, Firestore, Storage, and Auth instances.
  - `session.ts` & `admin-authorization.ts`: HMAC session token generation, validation, and multi-admin authorization.
  - `api-guards.ts` & `http.ts`: Standardized admin API authentication guards and JSON response helpers.
  - `cache.ts`: In-memory TTL caching layer for Firestore queries.
  - `storage.ts` & `system-logs.ts`: Atomic asset management and structured audit logging into Firestore.
- **Data Model (`src/types.ts`):** Multi-collection schema (`projects`, `experience`, `designs`, `certificates`, `services`, `accepted_admin_emails`, `admin_todos`, `system_logs`, and singleton `configuration/static_data`).

## Key Commands
- `pnpm dev` — Start local dev server at `http://localhost:4321` (auto-authenticates admin in DEV mode).
- `pnpm check` — Run Astro and TypeScript static typecheck (`astro check`).
- `pnpm build` — Production build (`astro check && astro build`).
- `pnpm preview` — Run local preview of the production build.

## Conventions & Rules
- **Package Management:** Always use `pnpm`. Never use `npm` or `yarn`.
- **Absolute Shadow Ban:** Never use CSS `box-shadow`, `text-shadow`, `filter: drop-shadow()`, SVG `<feDropShadow>`, or Tailwind `shadow-*` / `drop-shadow-*` classes. Express all elevation, depth, and hover feedback through solid Material 3 surface tones (`#121212`, `#1E1E1E`, `#2D2D2D`), borders, rings (`ring-2 ring-primary/40`), or transforms (`hover:-translate-y-1.5`).
- **Material 3 Dark Mode & Google Brand Colors:** Dark mode only (no light theme or toggles). Use strict Google Brand Colors: Google Blue (`#8AB4F8`/`#4285F4`), Google Green (`#81C784`/`#0F9D58`), Google Yellow (`#FDD663`/`#F9AB00`), Google Red (`#F28B82`/`#EA4335`).
- **Geometry:** `rounded-3xl` for main panels/cards, `rounded-xl` for buttons/chips/inputs, `rounded-full` for badges/pills.
- **Zero Public JS & CSS-Only Animations:** No client-side JS or third-party motion libraries (Framer Motion, GSAP, Lottie) on public pages. All animations use CSS `@keyframes` and Tailwind utilities with M3 easing (`cubic-bezier(0.2, 0, 0.2, 1)`).
- **Admin File Prefix:** All admin pages and API handlers inside `src/pages/admin/` must use the `admin_` prefix (e.g., `admin_projects.astro`, `admin_projects_api.ts`).
- **Asset Pipeline & Storage Lifecycle:**
  - Delete-before-upload: Always call `deleteObject()` on the existing Storage file before uploading a replacement.
  - Optimize all raster images to WebP (<50 KB) and compress SVGs.
  - Enforce explicit aspect ratios on media containers (`aspect-video`, `aspect-square`) to prevent Cumulative Layout Shift (CLS).
- **Contact Link Obfuscation:** Encode emails, phone numbers, and messaging links using Base64 or RTL CSS (`unicode-bidi: bidi-override; direction: rtl;`) to block scrapers.
- **Silent Version Bump & Git Push Lifecycle:**
  - Calculate minor version as elapsed days since `2026-06-01`: `floor((Current Date - 2026-06-01) in days)`.
  - Increment patch version silently in `package.json` at the end of every prompt turn (do not announce in chat).
  - Always execute: `git add .` -> `git commit -m "<concise summary>"` -> `git push`.

## Important Historical Context
- **Vercel Edge Read-Only Headers Fix:** Middleware (`src/middleware.ts`) clones `Response` with mutated `Headers` when direct mutation fails on Vercel serverless edges.
- **ESM Jose Module Compatibility:** Explicit overrides in `package.json` resolve ESM runtime imports for `jose` within `jwks-rsa` on Vercel.
- **SSR & Server Islands Evolution:** Migrated away from static prerendering to dynamic SSR with Astro Server Islands (`server:defer`) to combine fast initial TTFB with fresh Firestore data.
- **Self-Hosted Google Sans:** Fonts are bundled locally under `/public/fonts/` as WOFF2 files to eliminate third-party font request latency and layout shifting.
- **Dynamic Accent Color:** `src/lib/colors.ts` supplies a randomized Google brand color per page load (`--color-primary`) across public pages.

## Other Critical Information
- **Environment Variables:** Required server secrets include `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` (properly handling `\n`), `FIREBASE_STORAGE_BUCKET`, `ADMIN_EMAIL`, `GOOGLE_CLIENT_ID`, and `SESSION_SECRET`.
- **Local Development Auth:** In development mode (`import.meta.env.DEV`), `src/middleware.ts` automatically grants access to `/admin` using `ADMIN_EMAIL` if no session cookie exists.
- **Cache Management:** `src/lib/server/cache.ts` provides configurable TTL caching (`CACHE_TTL_MS.PUBLIC_DATA` and `CACHE_TTL_MS.ADMIN_DATA`) to avoid Firestore rate-limiting and quota overages.
