---
name: seo-meta-tags
description: SEO best practices for Astro pages including meta tags, OpenGraph, structured markup, and performance optimization.
triggers:
  - "seo"
  - "meta tags"
  - "opengraph"
  - "page title"
  - "meta description"
  - "lighthouse"
---

# SEO & Meta Tags

## Current Head Component

`src/components/Head.astro` provides basic meta:

```astro
<head>
  <meta charset="utf-8" />
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <link rel="icon" href="/favicon.ico" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="generator" content={Astro.generator} />
  <title>{title} - saoudi.online</title>
</head>
```

## Missing SEO Elements (To Implement)

- `<meta name="description">` — unique per page
- OpenGraph tags (`og:title`, `og:description`, `og:image`, `og:url`)
- Twitter Card meta tags
- Canonical URL
- Structured data (JSON-LD)

## Enhanced Head Template

```astro
---
interface Props {
  title?: string;
  description?: string;
  ogImage?: string;
}

const { title = 'saoudi.online', description = 'Portfolio of Abderrahmane SAOUDI', ogImage = '/favicon.png' } = Astro.props;
const canonicalUrl = new URL(Astro.url.pathname, Astro.site);
---

<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <link rel="icon" href="/favicon.ico" />
  <title>{title} - saoudi.online</title>
  <meta name="description" content={description} />
  <link rel="canonical" href={canonicalUrl} />
  <meta property="og:title" content={`${title} - saoudi.online`} />
  <meta property="og:description" content={description} />
  <meta property="og:image" content={ogImage} />
  <meta property="og:url" content={canonicalUrl} />
  <meta name="generator" content={Astro.generator} />
</head>
```

## Performance Targets

- Lighthouse score ≥ 90
- LCP < 2.5s
- CLS < 0.1
- Use explicit aspect ratios on images: `aspect-video`, `aspect-square`
