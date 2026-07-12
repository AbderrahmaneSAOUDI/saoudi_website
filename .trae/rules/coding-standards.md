---
trigger: always_on
---
# Coding Standards

## File Naming

- Public pages: `src/pages/<name>.astro` (lowercase, no prefix)
- Admin pages: `src/pages/admin/admin_<name>.astro` (prefixed with `admin_`)
- Admin API endpoints: `src/pages/admin/admin_<name>.ts`
- Components: PascalCase `.astro` or `.tsx` (e.g., `ActionButton.astro`, `AdminDashboard.tsx`)
- Utilities/libraries: camelCase `.ts` (e.g., `colors.ts`, `firebase-admin.ts`)

## Astro Components

- Use typed `interface Props` in every Astro component frontmatter.
- Destructure props with defaults: `const { prop = default } = Astro.props;`
- Import styles at the top of frontmatter when needed.
- Use Astro's `<slot />` for component composition.

## TypeScript

- All types and interfaces live in `src/types.ts`.
- Use Zod schemas for runtime validation alongside TypeScript interfaces.
- Provide type guard functions (e.g., `isValidStaticData()`, `isValidPortfolioEntry()`).
- Always type-assert Firestore data immediately after retrieval.

## Tailwind CSS v4

- Token definitions use `@theme {}` blocks in `src/styles/global.css`.
- Custom responsive utilities use `@layer utilities {}`.
- Use Tailwind v4 syntax — no `tailwind.config.js` for colors (they're in CSS).
- The `tailwind.config.mjs` is used only for custom screen breakpoints.

## Component Patterns

- `BaseLayout.astro` — public pages (includes PublicHeader + PublicFooter)
- `BackgroundBaseLayout.astro` — standalone pages (login, admin)
- `Construction.astro` — placeholder for unbuilt public pages
- `AdminLayout.astro` — admin page wrapper with header + sign-out
- `AdminNavDock.astro` — floating bottom navigation dock for admin

## Code Quality

- Preserve all existing comments and docstrings unless directly modifying that code.
- Keep imports organized: Astro/framework imports → project imports → type imports.
- No unused imports or dead code.
- Use template literals for dynamic class strings in Astro.
