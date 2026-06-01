# saoudi.online — Abderrahmane SAOUDI — Personal Portfolio

Premium dark-mode, server-rendered personal portfolio built with Astro, Tailwind CSS, and Firebase (Admin SDK). This repository contains the source for the live site hosted at `www.saoudi.online`.

--

## Table of contents

- Overview
- Key features
- Tech stack
- Architecture
- Data model
- Admin & security
- Roadmap
- Contributing
- License

## Overview

This project is the single source for Abderrahmane SAOUDI's official portfolio: a dark-mode, glassmorphism-first, high-performance site served as pre-rendered HTML via Astro SSR on Vercel. Public pages are server-rendered from Firestore reads (Admin SDK) and delivered with zero client JavaScript for visitors.

For the full design and implementation spec, see [GEMINI.md](GEMINI.md).

## Key features

- Strict dark-mode only, heavy glassmorphism visuals
- Server-side rendering (Astro SSR) — 0 KB JS for public visitors
- Images served via Astro <Image /> and cached by Vercel CDN
- Simple protected Admin dashboard (React island) for CRUD
- Contact links obfuscated (Base64) to reduce spam
- Designed to remain within Firebase Spark (free) limits

## Tech stack

| Layer | Technology |
| ----: | :--------- |
| Framework | Astro (SSR) |
| Styling | Tailwind CSS |
| Interactivity (Admin) | React (client:only) |
| Database | Firebase Firestore (Admin SDK, server-side) |
| Storage | Firebase Storage (images, resume PDF) |
| Auth | Firebase Auth (Email/Password) |
| Deployment | Vercel (SSR) |

## Architecture (high-level)

Visitor → Vercel (Astro SSR) → Server reads Firestore (Admin SDK) → Edge Cache (5 min TTL) → Rendered HTML returned

Images: uploaded via Admin → Firebase Storage → served via Astro <Image /> → Vercel CDN caches WebP optimized images

## Firebase data model (summary)

- `configuration` (single document `static_data`): site-wide profile, contact, imageSettings, `resumeUrl`.
- `entries` (collection): all portfolio items (projects, experience, volunteering, certificates) differentiated by a `type` field.

Minimal interfaces and types are defined in `src/types.ts` (TypeScript).

## Admin & Security

- Admin UI is a React island mounted only at `/admin` (client:only="react").
- Authentication: Firebase Email/Password with a single admin UID.
- Firestore & Storage rules restrict writes to the exact admin UID (replace YOUR_EXACT_ADMIN_UID before production).

## Roadmap (short)

Phase 1: Project skeleton (Astro SSR, Tailwind, Firebase Admin integration)

Phase 2: Public pages (Home, Projects, Experience, Volunteering, Certificates, Resume)

Phase 3: Admin Dashboard (login gate, CRUD for entries, resume manager, image compression settings)

Phase 4: Launch polish (SEO verification, Lighthouse >= 90, final deployment to custom domain)

## Contributing

This repository is primarily authored by the site owner. If you find small issues (typos, formatting), open an issue or a PR and label it clearly. Major changes should be coordinated with the owner.

## License

This project is licensed under the MIT License. See the LICENSE file for details.

---

For the complete implementation spec, visuals, design tokens, security notes, and admin workflows, read [GEMINI.md](GEMINI.md).