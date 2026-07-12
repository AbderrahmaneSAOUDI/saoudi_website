# File Map & Dependencies

## Directory Tree (Key Files Only)

```text
.
├── .agents/               # AI agent configuration (THIS directory)
├── .env                   # Environment variables (gitignored)
├── .env.example           # Template for required env vars
├── astro.config.mjs       # Astro SSR + Vercel + React + Tailwind v4
├── tailwind.config.mjs    # Custom breakpoints only (colors in CSS)
├── tsconfig.json          # Extends astro/tsconfigs/strict
├── package.json           # pnpm, Astro 6.x, React 19.x, firebase-admin 14.x
├── public/
│   ├── favicon.{svg,ico,png}
│   ├── logo.png
│   ├── resume.{pdf,jpg}
│   └── linktree_qr.jpg
└── src/
    ├── middleware.ts       # Admin route guard
    ├── types.ts            # TypeScript interfaces + Zod schemas
    ├── env.d.ts            # App.Locals type augmentation
    ├── styles/
    │   ├── global.css      # Tailwind v4 @theme tokens + utilities
    │   └── background_animation.css  # Ambient dot/star keyframes
    ├── layouts/
    │   ├── BaseLayout.astro           # Public (Header + Footer + slot)
    │   ├── BackgroundBaseLayout.astro # Standalone (login, admin)
    │   └── Construction.astro         # Placeholder component
    ├── lib/
    │   ├── colors.ts      # Google brand color array + getRandomColor()
    │   ├── resume.ts      # Static resume URL constants
    │   └── server/
    │       ├── firebase-admin.ts  # Admin SDK singleton
    │       └── session.ts         # HMAC session create/verify
    ├── components/
    │   ├── Head.astro
    │   ├── PublicHeader.astro     # Responsive nav (icons < 1000px, labels ≥ 1000px)
    │   ├── PublicFooter.astro     # Social links + copyright
    │   ├── ActionButton.astro     # primary/surface/header variants
    │   ├── NavItem.astro          # Active/inactive pill link
    │   ├── SocialIconButton.astro # Circular icon link
    │   ├── FormTextInputField.astro
    │   ├── AdminDashboard.astro   # Server-rendered admin overview
    │   ├── AdminDashboard.tsx     # React island version (unused currently)
    │   └── admin/
    │       ├── AdminLayout.astro      # Admin header + sign-out + slot
    │       ├── AdminNavDock.astro      # Floating dock + FAB + image modal
    │       └── AdminTemplate.astro    # Empty placeholder
    └── pages/
        ├── index.astro            # Home (hero, stats, nav hub)
        ├── experience.astro       # Construction placeholder
        ├── projects.astro         # Construction placeholder
        ├── designs.astro          # Construction placeholder
        ├── certificates.astro     # Construction placeholder
        ├── volunteering.astro     # Construction placeholder
        ├── resume.astro           # Resume preview + download
        └── admin/
            ├── index.astro             # Dashboard overview
            ├── admin_login.astro       # Google GSI login + POST handler
            ├── admin_logout.ts         # Cookie clear + redirect
            ├── admin_experience.astro  # Stub
            ├── admin_projects.astro    # Stub
            ├── admin_designs.astro     # Stub
            ├── admin_certificates.astro # Stub
            ├── admin_volunteering.astro # Stub
            ├── admin_resume.astro      # Stub
            └── admin_global.astro      # Stub
```

## Import Dependency Graph

```mermaid
BaseLayout.astro
  → global.css → @theme tokens → background_animation.css
  → Head.astro → colors.ts
  → PublicHeader.astro → NavItem.astro, ActionButton.astro, resume.ts, @lucide/astro
  → PublicFooter.astro → SocialIconButton.astro, @lucide/astro

BackgroundBaseLayout.astro
  → global.css, Head.astro, colors.ts

middleware.ts → session.ts

admin_login.astro → BackgroundBaseLayout, session.ts, google-auth-library

admin/index.astro → BackgroundBaseLayout, AdminLayout, AdminDashboard.astro, AdminNavDock, firebase-admin.ts

admin/*.astro → BackgroundBaseLayout (stubs — no further imports yet)
```
