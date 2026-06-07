---
name: zero-js-ssr-routing
description: Architectures all public routing profiles to execute as 100% server-side rendered operations delivering a 0 KB client-JS footprint.
triggers:
  - "create route"
  - "fetch data"
  - "astro page"
  - "serverless function"
  - "ssr engine"
  - "database query"
---

# Zero-JS SSR Routing

## System Context

This project uses Astro in **SSR output mode** deployed to Vercel Edge. Every public page is server-rendered HTML with **zero client-side JavaScript**. Data is fetched exclusively in Astro frontmatter blocks using the Firebase Admin SDK. Vercel Edge caching headers protect the Firebase Spark Plan free-tier read quota.

**Architectural references:**

- Astro config: `astro.config.mjs`
- Firebase Admin: `src/lib/firebase-admin.ts`
- Source of truth: `README.md` → Architecture & Data Flow

---

## Playbook

### 1 — SSR Execution Engine

Astro configuration must enforce server output mode:

```javascript
// astro.config.mjs
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';

export default defineConfig({
  output: 'server',
  adapter: vercel({ edgeMiddleware: true }),
});
```

### 2 — Frontmatter-Only Data Fetching

All data queries execute inside the Astro frontmatter fence (`---`). No `fetch()` calls in component templates or client scripts:

```astro
---
// src/pages/projects.astro
import { db } from '../lib/firebase-admin';
import type { PortfolioEntry } from '../types';

Astro.response.headers.set(
  'Cache-Control',
  'public, max-age=0, s-maxage=300'
);

const snapshot = await db.collection('entries')
  .where('type', '==', 'project')
  .get();

const projects: PortfolioEntry[] = snapshot.docs.map(doc => ({
  id: doc.id,
  ...doc.data()
} as PortfolioEntry));
---

<html>
  <!-- Pure HTML/CSS output, zero JS -->
</html>
```

### 3 — Edge Cache Optimization

Every public route must attach Vercel Edge caching headers providing a 5-minute TTL buffer:

```astro
---
Astro.response.headers.set(
  'Cache-Control',
  'public, max-age=0, s-maxage=300'
);
---
```

- `s-maxage=300` — Vercel Edge caches the response for 5 minutes
- `max-age=0` — browser always revalidates with edge
- Protects Firebase Spark free-tier read quotas from traffic spikes

### 4 — Firebase Admin Singleton

Initialize once, never re-initialize per request:

```typescript
// src/lib/firebase-admin.ts
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: import.meta.env.FIREBASE_PROJECT_ID,
      clientEmail: import.meta.env.FIREBASE_CLIENT_EMAIL,
      privateKey: import.meta.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

export const db = getFirestore();
```

### 5 — Zero JS Verification

After building, confirm no `<script>` tags in public HTML (except the `atob()` contact decoder):

```bash
grep -r '<script' dist/ --include='*.html' | grep -v '/admin'
# Expected: only atob() inline scripts for contact links
```

---

## Hard Guardrails

- **BANNED:** `output: 'static'` or `output: 'hybrid'` in Astro root config.
- **BANNED:** Client-side `fetch()`, `XMLHttpRequest`, or network calls in public templates.
- **BANNED:** Firebase Client SDK (`firebase/app`, `firebase/firestore`) on public routes.
- **BANNED:** `<script>` tags on public pages (except minimal inline `atob()` decoder).
- **BANNED:** `client:load`, `client:visible`, `client:idle`, or `client:only` on public route components.
- **BANNED:** Real-time Firestore listeners (`onSnapshot`) on public routes.
- **BANNED:** Third-party data-fetching libraries (SWR, React Query) on public routes.
- **REQUIRED:** Every public `.astro` page includes `Cache-Control` with `s-maxage=300`.
- **REQUIRED:** All Firestore queries use the Admin SDK singleton.
- **REQUIRED:** TypeScript type assertions on all Firestore data.
