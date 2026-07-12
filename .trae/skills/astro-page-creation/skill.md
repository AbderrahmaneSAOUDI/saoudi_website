---
name: astro-page-creation
description: Step-by-step playbook for creating new Astro public pages that fetch data from Firestore and render with zero client-side JS.
triggers:
  - "create page"
  - "new route"
  - "public page"
  - "add page"
  - "astro page"
---

# Astro Public Page Creation

## When to Use

When creating any new public-facing page under `src/pages/`.

## Playbook

### Step 1 — Create the Page File

```astro
---
// src/pages/<name>.astro
import BaseLayout from '../layouts/BaseLayout.astro';
import { getFirebaseAdminDb } from '../lib/server/firebase-admin';
import type { PortfolioEntry } from '../types';

// Set Vercel Edge Cache (5-minute TTL)
Astro.response.headers.set('Cache-Control', 'public, max-age=0, s-maxage=300');

// Fetch data server-side
const db = getFirebaseAdminDb();
const snapshot = await db.collection('entries')
  .where('type', '==', '<type_literal>')
  .orderBy('dateOrPeriod', 'desc')
  .get();

const items: PortfolioEntry[] = snapshot.docs.map(doc => ({
  id: doc.id,
  ...doc.data()
} as PortfolioEntry));
---

<BaseLayout title="Page Title">
  <!-- Pure HTML/CSS output, zero JS -->
  <div class="mx-auto px-4 sm:px-6 lg:px-8 py-16 max-w-7xl">
    <!-- Page content here -->
  </div>
</BaseLayout>
```

### Step 2 — Apply Design Tokens

- Wrap in `BaseLayout` (provides PublicHeader + PublicFooter + animated background)
- Use M3 surface containers: `bg-surface-container`, `bg-surface-container-high`
- Cards: `rounded-3xl`, `border border-white/10`
- Hover: `transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lg hover:ring-2 hover:ring-primary/40`
- Text: `text-white` (headings), `text-white/70` (body), `text-primary` (accents)

### Step 3 — Add Navigation Entry

Update `src/components/PublicHeader.astro` navLinks array:

```typescript
const navLinks = [
  // ... existing links
  { href: '/<name>', label: 'Label', icon: IconName },
];
```

Also update `src/pages/index.astro` navCards array if the page should appear in the home hub.

### Step 4 — Verify Zero-JS Output

After building, confirm no `<script>` tags appear in the page's HTML output:

```bash
pnpm run build && grep -r '<script' dist/ --include='*.html' | grep '<name>'
```

## Checklist

- [ ] Page file created in `src/pages/`
- [ ] Uses `BaseLayout` wrapper
- [ ] Data fetched in frontmatter with Admin SDK
- [ ] `Cache-Control` header set
- [ ] TypeScript types applied to fetched data
- [ ] Navigation entry added to header
- [ ] Hover effects on all interactive elements
- [ ] `rounded-3xl` on cards, `rounded-xl` on chips/badges
- [ ] No `<script>` tags or client-side JS
