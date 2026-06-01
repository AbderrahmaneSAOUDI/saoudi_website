# 🚀 saoudi.online – Personal Portfolio

> [!NOTE]
> This document is the **single source of truth** and AI-assistant guide for building Abderrahmane SAOUDI's official personal portfolio website.
> Last architectural revision: Full overhaul based on engineering audit — all decisions are final and must be strictly respected.

---

## 📋 Project Overview

- **Description:** Premium dark-mode, fully responsive personal portfolio with heavy Glassmorphism and a modern Google Developer Program aesthetic. The site is data-driven via a server-rendered architecture, and includes a simple protected admin dashboard for easy content management.
- **Target Audience:** Tech recruiters, startup founders, GDG/community leaders, and potential collaborators.
- **Goal:** Deliver a futuristic, high-impact first impression in under 8 seconds — clearly showcasing n8n automation focus, mobile development skills, design analysis expertise, and strong volunteering leadership.

---

## 🛠️ Tech Stack

| Layer | Technology | Notes |
| :---- | :--------- | :---- |
| **Framework** | Astro (SSR mode) | Replaces Vite + React + React Router entirely |
| **Styling** | Tailwind CSS | Native transitions only — no animation libraries |
| **Interactivity** | Vanilla JS (inline, minimal) | Only where strictly necessary |
| **Admin UI** | React component (island) | Loaded **only** inside `/admin` via `client:only="react"` |
| **Database** | Firebase Firestore | Server-side reads via Admin SDK |
| **Storage** | Firebase Storage | Images served via Astro `<Image />` + Vercel CDN cache |
| **Authentication** | Firebase Auth (Email/Password) | Single admin user only |
| **Analytics** | Vercel Analytics | Server-side, 0 KB impact on visitors |
| **Deployment** | Vercel (SSR) | Custom domain `www.saoudi.online` |
| **Icons** | Lucide (SVG inline or Astro component) | |

### ❌ Explicitly Removed (Do Not Re-add)

- ~~Vite SPA~~
- ~~React 19 (global)~~
- ~~React Router v7~~
- ~~Framer Motion~~
- ~~Firebase Analytics~~
- ~~Firebase Hosting~~
- ~~clsx / tailwind-merge~~
- ~~Masonry Grid libraries~~
- ~~PDF generation libraries~~

---

## ✨ Key Features

- **Strictly Dark-Mode Only** (no toggle)
- **Heavy Glassmorphism** with backdrop blur and glowing effects via pure Tailwind CSS
- **Animated Mesh Gradient Background** (CSS-only, no JS)
- **Multi-Language Name-Cycling:** Hero section typography gracefully cycles (Arabic → French → English → Tifinagh) using pure CSS animation.
- **Smooth Hover Transitions** using Tailwind native utilities (`transition-all duration-300`, `hover:scale-105`, `hover:shadow-[glow]`)
- **Responsive CSS Grid** that collapses gracefully on mobile
- **100% Server-Rendered** — all content fetched from Firestore **on the server**, HTML delivered ready to the browser
- **Zero JavaScript** delivered to public visitors (except minimal inline scripts for contact obfuscation)
- **Admin Dashboard** (protected) for simple CRUD operations
- **SEO and Open Graph** tags injected server-side automatically
- **Contact Security:** Email, Telegram, and WhatsApp protected via Base64 obfuscation
- **Strict Sequential Asset Overwrite:** Resumes undergo a strict delete-before-upload logic to protect storage limits.

---

## 🏗️ Architecture & Structure

```text
Visitor Request
      │
      ▼
Vercel Edge (Astro SSR)
      │  ← Fetches data from Firestore (Admin SDK, server-side only)
      │  ← Applies Edge Cache (5 min TTL) to protect Firestore read quota
      ▼
Pure HTML + CSS response → Browser renders instantly (0 KB JS for visitors)

Images:
  └── Stored in Firebase Storage
  └── Served via Astro <Image /> → Vercel CDN auto-compresses & caches → Browser
      (Firebase Storage bandwidth is barely touched after first cache warm-up)

Admin (/admin):
  └── React island loaded client:only="react"
  └── Firebase Auth gates access
  └── Firebase Admin SDK writes back to Firestore/Storage
```

### Data Flow Summary

1. Visitor opens `saoudi.online` → Vercel receives request
2. Astro server queries Firestore **once** (or serves from Edge Cache)
3. Fully rendered HTML with SEO meta tags sent to browser
4. Browser displays the page instantly — no client-side data fetching
5. If visitor refreshes, they get updated data (no real-time listener needed)

---

## 🗺️ Sitemap & Page Structure

| Route | Purpose | JS for visitors |
| :---- | :------ | :-------------- |
| `/` | Hero + Stats + Navigation Hub (short, impactful) | 0 KB |
| `/projects` | Filterable project grid with URL-based filtering | 0 KB |
| `/experience` | Scroll timeline of professional experience | 0 KB |
| `/volunteering` | GDG & leadership impact with stats | 0 KB |
| `/certificates` | Two-column certificate gallery | 0 KB |
| `/resume` | Static PDF viewer + download button | 0 KB |
| `/admin` | Protected dashboard (React island, full CRUD) | Firebase SDK only |

> [!NOTE]
> The `/resume` page displays a preview of the currently stored PDF and a download button. The PDF itself is managed manually via the Admin Dashboard utilizing strict sequential asset overwrite logic.

---

## 📂 Firebase Data Schema (Simplified — 2 Collections Only)

### Collection 1: `configuration` (single document: `static_data`)

Stores all global site settings, static profile information, and persistent admin configurations.

```typescript
interface StaticData {
  name: string;
  title: string;
  bio: string;
  skills: string[];           // e.g. ["Flutter", "Firebase", "n8n", "Tailwind"]
  resumeUrl: string;          // Firebase Storage URL of the current PDF
  contact: {
    email: string;            // Stored plain; obfuscated at render time
    telegram: string;
    whatsapp: string;
  };
  imageSettings: {
    quality: number;          // Persistent client-side compression settings 
    maxWidth: number;         // Persistent client-side compression settings 
  };
}
```

### Collection 2: `entries` (dynamic, all portfolio items)

A single unified collection for all portfolio content, differentiated exclusively by a constrained `type` literal string.

```typescript
interface PortfolioEntry {
  id: string;                                                        
  type: 'project' | 'experience' | 'volunteering' | 'certificate';   // Drives filtering & display
  title: string;
  description: string;
  dateOrPeriod: string;
  imageUrl?: string;          
  tags?: string[];            
}
```

> [!IMPORTANT]
> **No other collections should be created.** All content (projects, work history, GDG events) must live strictly in `entries`. The literal string constraint `'project' | 'experience' | 'volunteering' | 'certificate'` is the sole differentiating mechanism for layout and filtering.

---

## 🔥 Firebase Free Tier Strategy (Spark Plan)

### Why the Risk Is Manageable

This is a personal portfolio with a small, targeted audience (recruiters, collaborators). Daily traffic in year one is expected to be low. The Astro SSR architecture with Edge Caching protects against both organic traffic spikes and random bot crawlers.

### How the Architecture Protects Firestore Reads

- Data is fetched **on the server**, not in the visitor's browser
- Edge Cache (5-minute TTL on Vercel) means thousands of visitors trigger **only one** Firestore read every 5 minutes
- No real-time listeners anywhere on public pages
- Firestore writes happen only via the Admin Dashboard (your actions only)

### How the Architecture Protects Storage Bandwidth

- All images pass through Astro's `<Image />` component
- Vercel CDN caches compressed WebP versions of all images automatically
- Firebase Storage is only hit on the **first request** per image; all subsequent requests are served from Vercel's CDN
- Images are compressed before upload in the Admin Dashboard (see Asset Pipeline section)

### Firebase Spark Plan Limits Reference

| Resource | Limit | Risk Level |
| :------- | :---- | :--------- |
| Firestore Reads | 50,000 / day | 🟢 Low (Edge Cache absorbs traffic) |
| Firestore Writes | 20,000 / day | 🟢 Very Low (admin-only writes) |
| Firestore Storage | 1 GB | 🟢 Low (text data only) |
| Cloud Storage Space | 5 GB | 🟢 Low (compressed WebP images) |
| Cloud Storage Bandwidth | 1 GB / day | 🟢 Low (Vercel CDN absorbs traffic) |

---

## 🗓️ Roadmap

### Phase 1: Foundation & Infrastructure

- [ ] Astro project setup with SSR mode enabled for Vercel
- [ ] Tailwind CSS configuration with Glassmorphism design tokens
- [ ] Firebase Admin SDK integration (server-side only)
- [ ] Base layout, Navbar, and responsive navigation
- [ ] TypeScript interfaces file (`src/types.ts`)

### Phase 2: Public Pages

- [ ] Home page (`/`) — Hero + Stats + Navigation Hub
- [ ] Projects page (`/projects`) — Responsive Grid + URL-based filtering
- [ ] Experience page (`/experience`) — Scroll-animated timeline (CSS-only)
- [ ] Volunteering page (`/volunteering`) — GDG stats and highlights
- [ ] Certificates page (`/certificates`) — Two-column responsive gallery
- [ ] Resume page (`/resume`) — PDF preview + download button

### Phase 3: Admin Dashboard

- [ ] Admin layout (React island, isolated from public bundle)
- [ ] Firebase Auth login gate for `/admin`
- [ ] Dashboard: Edit `static_data` (profile, skills, contact info, imageSettings)
- [ ] Dashboard: Full CRUD for `entries` collection
- [ ] Dashboard: Resume PDF manager (preview current + strict sequential replace)
- [ ] Dashboard: Image compression settings panel (quality, maxWidth controls)
- [ ] Firebase Security Rules configuration

### Phase 4: Polish & Launch

- [ ] SEO validation (verify OG tags render correctly via server)
- [ ] Contact link security (Base64 obfuscation applied to all contact hrefs)
- [ ] Vercel Analytics integration
- [ ] Performance testing (Lighthouse target: ≥ 90)
- [ ] Cross-device testing and final CSS polish
- [ ] Production deployment on custom domain

---

## 📐 Design System & Visual Rules

### Color & Aesthetic

- **Background:** Deep dark (`#0a0a0f` or equivalent)
- **Primary Accent:** Tech Cyan / Violet gradient
- **Glassmorphism base class:**

  ```css
  bg-white/5 backdrop-blur-md border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]
  ```

### Typography & Animation Rules

- **Multi-language name-cycling:** Implemented via pure CSS animation (Arabic → French → English → Tifinagh) avoiding Framer Motion entirely.
- **Section headings:** Fade-in + slight upward movement via Tailwind `@keyframes` or `animate-` utilities.
- **Allowed:** Tailwind CSS native transitions (`transition`, `duration`, `ease`, `hover:`, `group-hover:`)
- **Forbidden:** Framer Motion, GSAP, or any JS animation library on public pages

### Grid Layout

- Use **Responsive CSS Grid** with explicit `col-span` and `row-span` for Bento-style layouts.
- Enforce fixed aspect ratios on image containers (`aspect-video`, `aspect-square`).
- Use Flexbox (`flex flex-col justify-between`) inside cards.
- **No Masonry layouts** — stability with dynamic data is the priority.

---

## 📱 Mobile Strategy

- Homepage (`/`) is inherently short — stats + navigation links only, no scroll fatigue
- Content-heavy pages (`/projects`, `/certificates`) use **URL-parameter filtering** for mobile (`/projects?type=flutter`)
- Filter buttons visible only on mobile (`block md:hidden`), full grid shown on desktop
- Certificate gallery uses `grid-cols-2` on mobile, `grid-cols-3 lg:grid-cols-4` on desktop

---

## 🖼️ Image Asset Pipeline (Admin Dashboard)

All image compression happens **client-side inside `/admin` only** using `compressorjs`.

### Admin Settings Panel & Persistence

The Admin Dashboard exposes a Compression Settings panel:

- Quality slider (0.5 → 1.0, default 0.8)
- Max Width input (px, default 1200)

*These settings do not reset on reload. They are saved directly into the `configuration` collection inside `static_data.imageSettings` so they persist seamlessly across devices and sessions.*

### Result

- Images stored in Firebase Storage: typically 80–150 KB (WebP).
- Served to visitors: optimized and cached by Vercel CDN via Astro `<Image />`.

---

## 📄 Resume PDF Management (Admin Dashboard)

The resume section uses a **strict sequential asset overwrite logic**:

### Replace Logic (Strict Order)

1. Admin selects a new PDF file.
2. On confirm, the codebase calls `deleteObject()` on Firebase Storage to permanently delete the old PDF file first.
3. Only after a successful deletion response, `uploadBytes()` pushes the new file.
4. The final, new Storage URL updates `static_data.resumeUrl` in Firestore.

> [!NOTE]
> The admin accepts full responsibility for keeping the PDF in sync with site content. There is no auto-generation — whatever is stored via overwrite strategy is what the Astro app displays.

---

## 🔒 Admin Security

### Authentication & Rules

Authenticated strictly via Firebase Email/Password. Rules enforce total restriction of write abilities up to a single hardcoded UUID (`YOUR_EXACT_ADMIN_UID`).

---

## 🔐 Contact Link Security (Anti-Spam)

All contact links in the public HTML are protected using **Base64 obfuscation**. Static HTML exposes only `YWJkZXJyYWhtYW5lQGV4...`. A minimal inline script decodes `atob()` dynamically upon user click or hover. Bots scanning the DOM structure gain zero data, effectively mitigating spam vulnerabilities footprint.

---

## 🧭 Architectural Manifest (Engineering Audit)

### Core Architectural Shift

- **Framework Pivot:** Switched from Vite + React SPA to **Astro SSR** (Vercel-hosted).
- **0 KB Public JS Footprint:** Delivery of pure HTML/CSS on public routes.
- **Admin Workspace Isolation:** Client libraries and interactive components are strictly sealed off within the `/admin` React island (`client:only="react"`).

### Database & Security Infrastructure

- **Schema Flattening:** 2-collection structure (`configuration` and `entries`).
- **Server-Side Access Only:** Bypasses Firebase Client SDK entirely for public visitors; handles access statically via Firebase Admin SDK.

### Optimization & Free-Tier Hardening

- **Vercel Edge Cache Protection:** 5-minute TTL edge cache to shield Firestore Spark tier.
- **Admin-Only Compression:** Images encoded and resized dynamically in-browser leveraging `configuration` persistent rules, minimizing upload sizing without server bloat.

## 💡 AI Assistant Instructions

### Core Requirements

- **Framework:** Astro SSR
- **Styling:** Tailwind CSS only
- **Database:** Firebase Admin SDK exclusively for visitors
- **Admin:** React island (`client:only="react"`)
- **Schema:** Strictly 2 collections — `configuration` (1 doc) and `entries` (`type` string constrained)
- **Contact:** Base64-obfuscated in the rendered HTML
