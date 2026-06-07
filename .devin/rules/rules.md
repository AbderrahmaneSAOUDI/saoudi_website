---
trigger: always_on
---
# 📜 Global Project Rules & Constraints (saoudi.online)

You must strictly obey these 15 individual engineering and design rules for every single file modification, code generation, and workspace interaction.

---

## 🏗️ Core Architecture Laws

1. **Framework Output Mode:** Always use Astro configured strictly in Server-Side Rendering (SSR) mode deployed to Vercel.
2. **Public Data Fetching:** Execute all public database reads exclusively inside the server-side Astro frontmatter script block using the `firebase-admin` SDK.
3. **Client SDK Restriction:** The standard Firebase Client SDK is strictly forbidden on public routes (`src/pages/` paths, except `/admin`) to minimize visitor bundle sizes.
4. **Admin Panel Isolation:** Confine all administrative actions, CRUD views, and client authentication layers entirely to the `/admin` route as a React component island loaded via `client:only="react"`.

---

## 🎨 Visual Identity & Design System Laws

5. **Strict Dark-Mode Baseline:** The user interface must be strictly Dark-Mode Only. Do not generate light themes, light-mode media queries, or theme toggles.
6. **Opaque Background Space:** Maintain a solid, dark background canvas color space adhering to Material 3 specifications (e.g., `#141218`). Glassmorphism layers, alpha-channel transparent backdrops, and blur masks are strictly banned.
7. **Component Surface Elevations:** Group all card layouts and dashboard blocks using solid Material 3 container elevation tokens (`Surface Container Low`, `Surface Container`, `Surface Container High`).
8. **Strict Google Brand Color Palette:** Restrict all accent variations, hover states, active chips, and buttons exclusively to official Google Brand Colors optimized for dark-mode contrast:
   - **Primary/Accent:** Google Blue (`#8AB4F8`).
   - **Secondary/Success:** Google Green (`#81C995`).
   - **Tertiary/Warning:** Google Yellow (`#FDE293`).
   - **Error/Alert:** Google Red (`#F28B82`).
9. **Material 3 Geometry:** Enforce strict geometric curves using fully rounded `rounded-3xl` parameters for Bento grid panels and `rounded-xl` for interactive badges, text chips, and buttons.

---

## ⚡ Performance & Security Laws

10. **Zero-JS Public Target:** Deliver a true 0 KB client-side JavaScript runtime footprint to public visitors.
11. **Pure-CSS Motion Engine:** Implement all transitions, hover shifts, text animations, and background elements purely via native Tailwind utilities or pure CSS `@keyframes`. Third-party layout or motion engines (e.g., Framer Motion, GSAP, masonry grid packages) are completely forbidden.
12. **Layout Shift Prevention:** All visual wrapper spaces housing dynamic content or image assets must enforce explicit, fixed aspect ratios (`aspect-video`, `aspect-square`) to permanently stop Cumulative Layout Shifts (CLS).
13. **Flat Database Schema Constraints:** Restrict the entire Firestore database structure strictly to two flat collections: `configuration` and `entries`. Do not create or initialize any other collections.
14. **Strict Entry Type Literals:** Every document written to the `entries` collection must strictly match the exact TypeScript type literal constraint: `type: 'project' | 'experience' | 'volunteering' | 'certificate'`.
15. **Anti-Spam Link Obfuscation:** Public communication channels (Email, Telegram, WhatsApp) must be hardcoded in standard markup as Base64-encoded strings, resolved via native inline `atob()` decoders exclusively upon direct human click or hover intent.
16. **Atomic Resume Overwrite Lifecycle:** Modifying the curriculum vitae PDF must invoke a strict asynchronous sequence: call `deleteObject()` on Firebase Storage to permanently clear the old asset *before* executing `uploadBytes()` to initialize the new document, preventing free-tier bloat.
