---
name: server-side-seo-analytics
description: Integrates dynamic discovery parameters and search indicators during compilation while keeping zero tracking scripts in client bundles.
triggers:
  - "open graph"
  - "og meta"
  - "seo header"
  - "vercel analytics"
  - "tracking data"
---

# Server-Side SEO & Analytics

## System Context

All SEO metadata (Open Graph tags, titles, descriptions) must be rendered **server-side** in Astro layout templates. No client-side meta injection libraries are permitted. Traffic analytics use Vercel Web Analytics exclusively — zero-JS, server-side telemetry with no impact on visitor bundle size.

**Architectural references:**
- Source of truth: `README.md` → Roadmap Phase 4

---

## Playbook

### 1 — Metadata Bundling

Inject complete Open Graph (OG) social parameters, title tags, and page descriptions into layouts using server-side expressions inside the template headers.

```astro
---
// Example: src/components/SEO.astro
interface Props {
  title: string;
  description: string;
  image?: string;
  url?: string;
}

const { title, description, image = '/og-default.png', url = Astro.url.href } = Astro.props;
---
<title>{title}</title>
<meta name="description" content={description} />
<meta property="og:title" content={title} />
<meta property="og:description" content={description} />
<meta property="og:image" content={image} />
<meta property="og:url" content={url} />
<meta property="og:type" content="website" />
<link rel="canonical" href={url} />
```

### 2 — Zero-JS Telemetry

Track production metrics exclusively using server-side analytics or the native 0 KB client-JS Vercel Web Analytics properties.

Configure Vercel Web Analytics server-side integration via the Astro adapter:

```javascript
// astro.config.mjs
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';

export default defineConfig({
  output: 'server',
  adapter: vercel({
    webAnalytics: {
      enabled: true,
    },
  }),
});
```

---

## Hard Guardrails

- **BANNED:** Client-side meta tag injection libraries (`react-helmet`, `next-seo`).
- **BANNED:** Client-side analytics scripts (Google Analytics JS, Plausible client, Fathom client).
- **BANNED:** Third-party tracking pixels or scripts on public pages.
- **BANNED:** Duplicate `<title>` tags or missing `og:` tags on any page.
- **BANNED:** Hardcoded URLs in OG tags — must use `Astro.url.href` or equivalent.
- **REQUIRED:** Every public page must pass unique `title` and `description` to the layout.
- **REQUIRED:** A default OG image (`/og-default.png`) must exist in the `public/` directory.
- **REQUIRED:** Vercel Analytics must be configured as server-side only via the adapter config.
