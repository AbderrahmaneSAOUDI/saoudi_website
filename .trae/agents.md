# saoudi.online — AI Agent System Prompt

> **Single source of truth for all AI coding assistants working on this project.**
> This file is always loaded. Skills, hooks, and sidecars extend it on demand.

---

## Project Identity

- **Name:** saoudi.online
- **Owner:** Abderrahmane SAOUDI
- **Type:** Personal portfolio website
- **Live URL:** https://www.saoudi.online
- **Repository:** `AbderrahmaneSAOUDI/saoudi_website`

---

## Tech Stack (Locked)

| Layer | Technology | Version Constraint |
|---|---|---|
| Framework | Astro (SSR mode, `output: 'server'`) | ^6.x |
| Adapter | `@astrojs/vercel` | ^10.x |
| Styling | Tailwind CSS v4 (via `@tailwindcss/vite`) | ^4.x |
| Icons | `@lucide/astro` | ^1.x |
| Types | TypeScript (strict, `astro/tsconfigs/strict`) | — |
| Validation | Zod | ^4.x |
| Server DB | `firebase-admin` (Firestore + Storage) | ^14.x |
| Auth | `google-auth-library` (Google GSI on login page) | ^10.x |
| Admin UI | React (island, `client:only="react"`) | ^19.x |
| Package Manager | pnpm | — |
| Deployment | Vercel (SSR) | — |
| Node | ≥22.12.0 | — |

---

## Architecture Summary

```
src/
├── components/          # Astro (.astro) + React (.tsx) components
│   ├── admin/           # Admin-only components (AdminLayout, AdminNavDock, AdminTemplate)
│   ├── Head.astro       # <head> metadata component
│   ├── PublicHeader.astro
│   ├── PublicFooter.astro
│   ├── ActionButton.astro
│   ├── NavItem.astro
│   ├── SocialIconButton.astro
│   ├── FormTextInputField.astro
│   ├── AdminDashboard.astro
│   └── AdminDashboard.tsx  # React island (client:only="react")
├── layouts/
│   ├── BaseLayout.astro           # Public page shell (Header + Footer + slot)
│   ├── BackgroundBaseLayout.astro # Minimal shell (no header/footer, for login/admin)
│   └── Construction.astro         # Placeholder for unbuilt pages
├── lib/
│   ├── colors.ts        # Google brand color palette + getRandomColor()
│   ├── resume.ts        # Static resume URL constants
│   └── server/
│       ├── firebase-admin.ts  # Singleton Firebase Admin SDK init
│       └── session.ts         # HMAC-signed session token create/verify
├── pages/
│   ├── index.astro              # Home page (hero, stats, nav cards)
│   ├── experience.astro         # Public experience (Construction placeholder)
│   ├── projects.astro           # Public projects (Construction placeholder)
│   ├── designs.astro            # Public designs (Construction placeholder)
│   ├── certificates.astro       # Public certificates (Construction placeholder)
│   ├── volunteering.astro       # Public volunteering (Construction placeholder)
│   ├── resume.astro             # Public resume preview + download
│   └── admin/
│       ├── index.astro          # Admin dashboard overview
│       ├── admin_login.astro    # Google GSI login page + POST handler
│       ├── admin_logout.ts      # GET endpoint: clears cookie + redirects
│       ├── admin_experience.astro
│       ├── admin_projects.astro
│       ├── admin_designs.astro
│       ├── admin_certificates.astro
│       ├── admin_volunteering.astro
│       ├── admin_resume.astro
│       └── admin_global.astro
├── styles/
│   ├── global.css               # Tailwind v4 @theme tokens + responsive utilities
│   └── background_animation.css # Ambient dot/star background keyframes
├── middleware.ts                 # Admin route guard (cookie verification)
├── types.ts                     # Zod schemas + TypeScript interfaces
└── env.d.ts                     # Astro locals type augmentation
```

---

## Data Flow

1. **Public routes:** Visitor → Vercel Edge → Astro SSR → Firebase Admin SDK (Firestore read) → HTML response (zero JS)
2. **Admin routes:** Admin → `/admin/admin_login` (Google GSI) → HMAC cookie set → Middleware validates cookie → Admin pages served
3. **Admin CRUD:** React island → Client Firebase SDK (planned) → Firestore/Storage direct writes

---

## Known Issues & Tech Debt

1. **Admin pages are stubs:** Most `admin/admin_*.astro` pages are empty shells wrapping `BackgroundBaseLayout`.
2. **Devin rules reference `#8AB4F8` dark tones** but `global.css` uses raw Google brand `#4285F4` — slight inconsistency between rules and implementation.
3. **Several public pages** (experience, projects, designs, certificates, volunteering) show only a "Construction" placeholder.

---

## Environment Variables (Required)

```
FIREBASE_PROJECT_ID=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_STORAGE_BUCKET=...
ADMIN_EMAIL=...
GOOGLE_CLIENT_ID=...
```

---

## Critical Conventions

1. **Admin routes** are prefixed with `admin_` inside `src/pages/admin/` (e.g., `admin_login.astro`, `admin_experience.astro`)
2. **Middleware** intercepts all `/admin/*` except `/admin/admin_login` and checks `admin_session` cookie
3. **Session tokens** are HMAC-SHA256 signed with `FIREBASE_PRIVATE_KEY` and expire in 7 days
4. **Random primary color** is assigned per page load via `getRandomColor()` from `src/lib/colors.ts`
5. **pnpm** is the exclusive package manager — never use npm or yarn
6. **Dev server** runs on `localhost:4321` via `pnpm run dev`
