# System Architecture & Technical Design

## High-Level Architecture

`saoudi.online` is built with a decoupled architecture separating high-performance zero-JS public rendering from an authenticated administrative workspace:

```mermaid
graph TD
    User([Public Visitor]) -->|HTTPS| Edge[Vercel Serverless Edge]
    Admin([Administrator]) -->|HTTPS /admin/*| Edge
    
    subgraph "Astro SSR Server"
        Edge --> MW[Astro Middleware (src/middleware.ts)]
        MW -->|Public Route / Server Island| PublicSSR[Astro Frontmatter SSR]
        MW -->|Admin Route| AuthGuard[Admin Authorization & Session Token]
        AuthGuard -->|Authenticated| AdminSSR[Admin Workspace SSR]
        AuthGuard -->|Unauthenticated| LoginRedirect[Redirect /admin/admin_login]
    end
    
    subgraph "Data & Storage Layer"
        PublicSSR --> Cache[In-Memory Cache (src/lib/server/cache.ts)]
        Cache -->|Cache Miss| AdminSDK[Firebase Admin SDK Singleton]
        AdminSSR --> AdminSDK
        AdminSDK --> Firestore[(Cloud Firestore)]
        AdminSDK --> Storage[(Firebase Storage)]
    end
```

## Core Architectural Subsystems

### 1. Zero-JS Public Pages & Astro Server Islands
- Public pages (`src/pages/*.astro`) render standard semantic HTML and CSS to visitors with 0 KB client-side JavaScript.
- Heavy sections (`ProjectsIsland.astro`, `ExperienceIsland.astro`, `DesignsIsland.astro`, `CertificationsIsland.astro`, `HomeCountsIsland.astro`, `ResumeIsland.astro`) utilize Astro Server Islands (`server:defer`).
- While islands load asynchronously in the background, a skeleton shimmer fallback (`<SkeletonCardGrid slot="fallback" />`) renders instantly, ensuring fast TTFB and high Lighthouse scores without client hydration overhead.

### 2. Protected Admin Workspace & Route Isolation
- All administrative pages live in `src/pages/admin/` with the required `admin_` prefix.
- `src/middleware.ts` intercepts all `/admin/*` requests (except `/admin/admin_login`) and validates the HMAC-SHA256 signed `admin_session` cookie against `ADMIN_EMAIL` and `accepted_admin_emails`.
- In local development (`import.meta.env.DEV`), middleware automatically authenticates the primary admin email to streamline development workflows.

### 3. Server-Side Data Layer & Caching
- All Firestore access is executed server-side via `firebase-admin` singleton initialized in `src/lib/server/firebase-admin.ts`.
- `src/lib/server/cache.ts` provides in-memory TTL caching (`CACHE_TTL_MS.PUBLIC_DATA` and `CACHE_TTL_MS.ADMIN_DATA`) to avoid Firestore quota exhaustion and rate limiting.
- Mutations in admin API handlers invoke `invalidateCache()` to instantly invalidate affected cache entries.

### 4. Media & Asset Pipeline
- Dynamic images are served via server proxy API routes (`src/pages/api/media/[collection]/[id].ts`) or direct public URLs with explicit aspect ratios (`aspect-video`, `aspect-square`) to prevent Cumulative Layout Shift (CLS).
- Image uploads follow an atomic delete-before-upload lifecycle in `src/lib/server/storage.ts` to prevent orphaned blobs.
