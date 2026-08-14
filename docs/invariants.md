# Core Invariants, Design Tokens & Hard Bans

This document defines the strict, non-negotiable engineering rules and design system specifications for `saoudi.online`.

---

## 🚫 Hard Bans (Absolute Prohibitions)

1. **Absolute Shadow Ban:**
   - Never use or recommend visual shadows of any kind: CSS `box-shadow`, `text-shadow`, `filter: drop-shadow()`, SVG `<feDropShadow>`, or Tailwind `shadow-*` and `drop-shadow-*` utilities.
   - Hierarchy and elevation MUST be expressed through solid Material 3 surface container tones, borders, rings, or CSS transforms (`hover:-translate-y-1.5`).
   - If an existing interface area contains a shadow, remove it when modifying that area.

2. **No Client-Side JavaScript on Public Routes:**
   - Public routes (`src/pages/*.astro`) must produce zero visitor JavaScript.
   - Do not add `<script>` tags (unless specifically scoped for non-JS progressive features like the lazy group loader), client directives (`client:load`, `client:visible`), or client-side libraries (React, Vue, Svelte) to public pages.

3. **No External Motion / Animation Libraries:**
   - Framer Motion, GSAP, Lottie, and Animate.css are strictly banned.
   - All animations must be written in pure CSS `@keyframes` and Tailwind CSS v4 transition utilities with M3 easing (`cubic-bezier(0.2, 0, 0.2, 1)`).

4. **No Light Mode or Theme Toggles:**
   - The UI is strictly Dark-Mode Only (`#121212` background). Do not introduce light themes or theme switchers.

5. **No npm or Yarn:**
   - Use `pnpm` exclusively for all package operations.

---

## 🎨 Design System Tokens

### Google Brand Color Palette (M3 Dark Compliant)
| Token | Name | Hex | Usage |
| :--- | :--- | :--- | :--- |
| `--color-primary` | Google Blue | `#8AB4F8` / `#4285F4` | Primary brand accent, active highlights, key badges |
| `--color-secondary` | Google Green | `#81C784` / `#0F9D58` | Success indicators, community roles, secondary chips |
| `--color-tertiary` | Google Yellow | `#FDD663` / `#F9AB00` | Warnings, achievements, highlights |
| `--color-error` | Google Red | `#F28B82` / `#EA4335` | Errors, alerts, destructive delete actions |

### Material 3 Dark Surface Containers
| Level | Hex | CSS Variable | Tailwind Class |
| :--- | :--- | :--- | :--- |
| **Canvas Background** | `#121212` | `--color-surface` | `bg-surface` |
| **Container Surface** | `#1E1E1E` | `--color-surface-container` | `bg-surface-container` |
| **Container Surface High** | `#2D2D2D` | `--color-surface-container-high` | `bg-surface-container-high` |

### Geometry Specifications
- **Bento Panels & Main Cards:** `rounded-3xl`
- **Buttons, Chips, Inputs, Badges:** `rounded-xl`
- **Pills, Nav Floats, Avatars:** `rounded-full`

---

## 🔒 Security & Privacy Invariants

- **Contact Obfuscation:** Email addresses, phone numbers, and messaging links on public pages are stored obfuscated (Base64) or rendered with RTL CSS direction (`unicode-bidi: bidi-override; direction: rtl;`) to block scrapers.
- **Admin Isolation:** Admin routes must strictly reside in `src/pages/admin/` with the `admin_` filename prefix to ensure automatic middleware route protection.
- **Delete-Before-Upload:** When replacing a resume PDF or media asset in Firebase Storage, `deleteObject()` must complete before `uploadBytes()` / file write begins.
