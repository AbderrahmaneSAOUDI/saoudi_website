---
trigger: always_on
---
# Architecture Rules

These rules are **non-negotiable** and apply to every file modification.

## Astro & SSR

1. Astro must remain in `output: 'server'` mode. Never switch to `static` or `hybrid`.
2. All public pages are `.astro` files in `src/pages/`. They produce zero client-side JavaScript.
3. The only allowed `client:*` directive is `client:only="react"` on admin-only React islands.
4. Never add `client:load`, `client:visible`, or `client:idle` to any component on public routes.

## Data Fetching

5. Public route data is fetched exclusively in Astro frontmatter (`---` fences) using the Firebase Admin SDK singleton from `src/lib/server/firebase-admin.ts`.
6. Never use `fetch()`, `XMLHttpRequest`, or Firebase Client SDK in public page templates.
7. Never create real-time Firestore listeners (`onSnapshot`) on public routes.

## Admin Isolation

8. All admin functionality lives under `src/pages/admin/` with the `admin_` filename prefix.
9. Admin pages use `BackgroundBaseLayout.astro` (no public header/footer).
10. Client-side JavaScript is permitted only within `/admin` routes.
11. The React island (`AdminDashboard.tsx` or future admin React components) is the only place where the Firebase Client SDK may be initialized.

## Package Management

12. Use `pnpm` exclusively. Never use `npm` or `yarn`.
13. Never add animation libraries (Framer Motion, GSAP, Animate.css, Lottie) to the project.
14. Never add masonry layout libraries.
15. Never add client-side data fetching libraries (SWR, React Query, TanStack Query) to public routes.
