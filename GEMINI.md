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

- Strictly Dark-Mode Only (no toggle)
- Heavy Glassmorphism with backdrop blur and glowing effects via pure Tailwind CSS
- Subtle animated mesh gradient background (CSS-only, no JS)
- Smooth hover transitions using Tailwind native utilities (`transition-all duration-300`, `hover:scale-105`, `hover:shadow-[glow]`)
- Fully responsive CSS Grid that collapses gracefully on mobile
- 100% server-rendered — all content fetched from Firestore **on the server**, HTML delivered ready to the browser
- Zero JavaScript delivered to public visitors (except minimal inline scripts for contact obfuscation)
- Simple protected Admin Dashboard for easy CRUD operations
- SEO and Open Graph tags injected server-side automatically — no extra tooling needed
- Contact via Email, Telegram, and WhatsApp only — protected via Base64 obfuscation
- Designed to stay comfortably within Firebase Spark Plan (free tier)

---

## 🏗️ Architecture & Structure

```
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
> The `/resume` page displays a preview of the currently stored PDF and a download button. The PDF itself is managed manually via the Admin Dashboard (upload new → auto-delete old).

---

## 📂 Firebase Data Schema (Simplified — 2 Collections Only)

### Collection 1: `configuration` (single document: `static_data`)

Stores all static profile information that changes infrequently.

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
    quality: number;
    maxWidth: number;
  };
}
```

### Collection 2: `entries` (dynamic, all portfolio items)

A single unified collection for all portfolio content, differentiated by a `type` field.

```typescript
interface PortfolioEntry {
  id: string;                                         // Firestore document ID
  type: 'project' | 'experience' | 'volunteering' | 'certificate';   // Drives filtering & display
  title: string;
  description: string;
  dateOrPeriod: string;
  imageUrl?: string;          // Firebase Storage URL (optional)
  tags?: string[];            // Technologies, tools, or categories
}
```

> [!IMPORTANT]
> **No other collections should be created.** All content (projects, work history, GDG events) lives in `entries`. The `type` field is the only differentiator.

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
- [ ] Dashboard: Edit `static_data` (profile, skills, contact info)
- [ ] Dashboard: Full CRUD for `entries` collection
- [ ] Dashboard: Resume PDF manager (preview current + replace with auto-delete)
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
  ```
  bg-white/5 backdrop-blur-md border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]
  ```
- **Hover glow example:**
  ```
  hover:shadow-[0_0_24px_rgba(99,102,241,0.4)] transition-all duration-300
  ```

### Typography

- Multi-language name cycling in the Hero (Arabic → French → English → Tifinagh) — implemented via CSS animation or minimal Vanilla JS, **no Framer Motion**
- Section headings: fade-in + slight upward movement via Tailwind `@keyframes` or `animate-` utilities

### Animation Rules

- **Allowed:** Tailwind CSS native transitions (`transition`, `duration`, `ease`, `hover:`, `group-hover:`)
- **Allowed:** CSS `@keyframes` defined in `global.css` for entrance animations
- **Forbidden:** Framer Motion, GSAP, or any JS animation library on public pages
- **Performance target:** 60fps on mid-range Android devices

### Grid Layout

- Use **Responsive CSS Grid** with explicit `col-span` and `row-span` for Bento-style layouts
- Enforce fixed aspect ratios on image containers (`aspect-video`, `aspect-square`) to prevent layout shifts from dynamic data
- Use Flexbox (`flex flex-col justify-between`) inside cards to align content regardless of text length
- **No Masonry layouts** — stability with dynamic data is the priority

---

## 📱 Mobile Strategy

- Homepage (`/`) is inherently short — stats + navigation links only, no scroll fatigue
- Content-heavy pages (`/projects`, `/certificates`) use **URL-parameter filtering** for mobile:
  - Example: `/projects?type=flutter` → Astro SSR filters `entries` on the server before rendering
  - Filter buttons visible only on mobile (`block md:hidden`), full grid shown on desktop
- Certificate gallery uses `grid-cols-2` on mobile, `grid-cols-3 lg:grid-cols-4` on desktop
- Card descriptions are truncated on mobile (`line-clamp-2`) and expandable on detail view

---

## 🖼️ Image Asset Pipeline (Admin Dashboard)

All image compression happens **client-side inside `/admin` only** using `compressorjs`.

### Upload Flow

1. Admin selects an image file (any format, any size)
2. `compressorjs` intercepts the file before upload:
   - Converts to `image/webp`
   - Resizes to `maxWidth` (configurable, default: 1200px)
   - Compresses to target quality (configurable, default: 0.8)
3. Compressed `Blob` is uploaded to Firebase Storage
4. Storage URL is saved to the corresponding Firestore document

### Admin Settings Panel

The Admin Dashboard exposes a **Compression Settings** panel with live controls:
- Quality slider (0.5 → 1.0, default 0.8)
- Max Width input (px, default 1200)
- Preview of original vs compressed size before upload
- *Note: These settings are stored in the `static_data` document (`imageSettings: { quality, maxWidth }`) so they persist across sessions and devices.*

### Result

- Images stored in Firebase Storage: typically 80–150 KB (WebP)
- Served to visitors: further optimized and cached by Vercel CDN via Astro `<Image />`

---

## 📄 Resume PDF Management (Admin Dashboard)

The resume section uses a **manual overwrite strategy**:

- Visitors see a PDF viewer and a "Download PDF" button linked to the current file URL stored in `static_data.resumeUrl`
- The Admin Dashboard shows a **Resume Manager panel** with:
  - An embedded preview of the current PDF
  - A "Replace Resume" file uploader

### Replace Logic (Strict Order)

1. Admin selects a new PDF file
2. On confirm, the code calls `deleteObject()` on Firebase Storage to permanently delete the old file
3. Only after successful deletion, `uploadBytes()` uploads the new file
4. The new Storage URL updates `static_data.resumeUrl` in Firestore

> [!NOTE]
> The PDF is manually designed and updated by the admin. The website always serves whatever file is currently stored — there is no auto-generation. The admin accepts full responsibility for keeping the PDF in sync with site content.

---

## 🔒 Admin Security

### Authentication

- Firebase Email/Password sign-in
- Auth state checked before rendering any Admin UI
- Unauthenticated access to `/admin` redirects to 404 or login

### Firebase Security Rules

**Firestore:**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == "YOUR_EXACT_ADMIN_UID";
    }
  }
}
```

**Cloud Storage:**
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == "YOUR_EXACT_ADMIN_UID";
    }
  }
}
```

> [!IMPORTANT]
> Replace `"YOUR_EXACT_ADMIN_UID"` with the actual UID from Firebase Authentication console before deploying to production.

---

## 🔐 Contact Link Security (Anti-Spam)

All contact links in the public HTML are protected using **Base64 obfuscation** to prevent Spam Bots from scraping personal contact details.

### Implementation

Contact data is stored encoded in the HTML. A minimal inline script decodes and injects the `href` only on user interaction (click or hover):

```html
<button
  data-contact="YWJkZXJyYWhtYW5lQGV4YW1wbGUuY29t"
  data-prefix="mailto:"
  onclick="this.closest('a').href = this.dataset.prefix + atob(this.dataset.contact)"
>
  Email Me
</button>
```

- Bots reading static HTML see only an encoded string — unusable
- Human visitors experience zero friction — the link resolves instantly on click

---

## 🎨 Visual Inspiration References

The following effects should be adapted in a CSS-only or minimal Vanilla JS manner. **No external animation libraries.**

| Source | Effect to Adapt |
| :----- | :-------------- |
| n8nlab.io | Hero headline reveal animation (CSS keyframes), animated mesh gradient background |
| sambenexpexps.lovable.app | "What I Offer" cards — glassmorphism style + hover lift + inner glow |
| zoetang.work | Multi-language name cycling in hero (CSS animation or minimal JS interval) |
| thelonelypixel.co.uk | Card hover: scale + glow + subtle movement (Tailwind `hover:` classes) |
| theoceanagency.org | Fade-in + upward drift on section headings (CSS `@keyframes` + `animation-delay`) |
| buzzworthystudio.com | Scroll-triggered image fade-in (Intersection Observer, ~10 lines Vanilla JS) |
| kprverse.com | Footer links fade-in on scroll (same Intersection Observer approach) |

> [!IMPORTANT]
> All effects must remain **performant on mobile (60fps)**. If an effect cannot be achieved with CSS or under 20 lines of Vanilla JS without a library, it should be **simplified or dropped**. Premium and purposeful always beats flashy.

---

## 💡 AI Assistant Instructions

- **Framework:** Astro SSR — all public pages render server-side, zero client JS for visitors
- **Styling:** Tailwind CSS only — no animation libraries, no clsx, no tailwind-merge
- **Database:** Firebase Firestore — reads via Admin SDK on the server, never from the browser on public pages
- **Admin:** React island (`client:only="react"`) isolated to `/admin` route only
- **Images:** Always use Astro `<Image />` component to enable Vercel CDN caching
- **Schema:** Two collections only — `configuration` (1 doc) and `entries` (typed items)
- **TypeScript:** Define interfaces in `src/types.ts` only — no duplication across files
- **Contact:** All contact hrefs must be Base64-obfuscated in the rendered HTML
- **Compression:** Image compression via `compressorjs` inside Admin only — never loaded on public pages
- **Resume:** PDF managed via overwrite logic in Admin — never auto-generated

### Pre-Flight Checklist (Critical)

- [ ] `YOUR_EXACT_ADMIN_UID` replaced in both Security Rules files before deploy
- [ ] Firebase Admin SDK credentials stored in Vercel environment variables (never in code)
- [ ] `.env` file with all keys gitignored
- [ ] Edge Cache configured on Vercel for Firestore-backed routes
- [ ] Basic loading states and error handling on all data-fetching pages
- [ ] 404 page implemented
- [ ] Favicon, `manifest.json`, and Open Graph meta tags verified
- [ ] Lighthouse performance score ≥ 90 confirmed before final deploy

---

## 🤝 Contributors

- Abderrahmane SAOUDI

---

## 📜 License

This project is licensed under the MIT License.
