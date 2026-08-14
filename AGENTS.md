# saoudi.online — Agent Operational Guide

Personal portfolio & admin CMS for Abderrahmane SAOUDI built with Astro SSR, TypeScript, Tailwind CSS v4, Firebase Admin SDK, and Vercel.

## Directory Map

- `src/pages/` — Public zero-JS SSR pages (`/`, `/projects`, `/experience`, `/designs`, `/certifications`, `/services`, `/volunteering`, `/resume`).
- `src/pages/admin/` — Protected admin pages & API endpoints (strictly prefixed with `admin_`).
- `src/components/` — Astro components, Server Islands (`*Island.astro`), and admin panels (`src/components/admin/`).
- `src/lib/server/` — Server-only singletons (`firebase-admin.ts`, `session.ts`, `admin-authorization.ts`, `cache.ts`, `system-logs.ts`, `storage.ts`).
- `src/lib/` — Shared client/rendering utilities (`colors.ts`, `media.ts`, `images.ts`, `date-utils.ts`).
- `src/styles/` — Global styling (`global.css`, `background_animation.css`).
- `src/types.ts` — Single authoritative schema (Zod schemas + TypeScript interfaces).
- `docs/` — Progressive disclosure architecture, invariants, and data model documentation.
- `.agents/skills/` — On-demand procedural playbooks and workflows.

## Key Commands

- `pnpm dev` — Start local dev server (auto-authenticates admin in DEV mode at `http://localhost:4321`).
- `pnpm check` — Static Astro & TypeScript typecheck (`astro check`).
- `pnpm build` — Production build (`astro check && astro build`).
- `pnpm preview` — Preview local SSR production build.

## Hard Constraints & Invariants

- **Package Manager:** Use `pnpm` exclusively (never `npm` or `yarn`).
- **Zero-JS Public Pages:** Never add client scripts, client frameworks, or client Firebase SDK to public routes. Keep public pages pure SSR HTML with pure CSS motion (why: speed & 0 KB visitor payload).
- **Absolute Shadow Ban:** Never use CSS/SVG/Tailwind visual shadows (`box-shadow`, `drop-shadow`, `shadow-*`). Use solid M3 surface container tones (`#121212`, `#1E1E1E`, `#2D2D2D`), borders, rings, or transforms (why: strict design system consistency).
- **Google Brand Palette:** Accent colors strictly limited to Google Blue (`#8AB4F8`/`#4285F4`), Green (`#81C784`/`#0F9D58`), Yellow (`#FDD663`/`#F9AB00`), and Red (`#F28B82`/`#EA4335`).
- **Admin File Prefix:** All admin pages and API handlers inside `src/pages/admin/` must start with `admin_` (why: middleware route matching and security isolation).
- **Storage Lifecycle:** Delete old Storage files before uploading replacements (why: atomic consistency & quota management).
- **Contact Obfuscation:** Obfuscate public contact values with Base64 / RTL CSS (why: automated scraper protection).
- **Mandatory Lifecycle Automation:**
  1. Verify with `pnpm run check` and `pnpm run build`.
  2. Silently increment patch version in `package.json` (`version-increment.md`).
  3. Git sync: `git add . && git commit -m "<version> - <summary>" && git push` (where `<version>` is the exact version in `package.json`, e.g. `git commit -m "1.74.349 - fix: description here"`).

## Progressive Disclosure Links

- System Architecture & Data Flow: [docs/architecture.md](file:///home/saoudi26/Documents/GitHub/PERSONAL/saoudi_website/docs/architecture.md)
- Core System Invariants & Rules: [docs/invariants.md](file:///home/saoudi26/Documents/GitHub/PERSONAL/saoudi_website/docs/invariants.md)
- Multi-Collection Data Model: [docs/data-model.md](file:///home/saoudi26/Documents/GitHub/PERSONAL/saoudi_website/docs/data-model.md)
- Workflows & Procedural Playbooks: [.agents/skills/](file:///home/saoudi26/Documents/GitHub/PERSONAL/saoudi_website/.agents/skills)
