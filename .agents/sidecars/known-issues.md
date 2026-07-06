# Known Issues & Tech Debt

## 🔴 Critical

*None*

## 🟡 Medium

### Missing Error Pages
No custom 404 or 500 error pages exist.

### No `astro.config.mjs` Image Domains
`firebasestorage.googleapis.com` is not whitelisted in the image domains config, which is needed for remote image optimization.

## 🟢 Low

### No Meta Descriptions
`Head.astro` only sets `<title>` but no `<meta name="description">` or OpenGraph tags.

### Construction Pages
5 public pages still show the Construction placeholder and need real implementation.

---

## ✅ Resolved Issues

### Route Collision: `/admin`
*Resolved:* Deleted `src/pages/admin.astro` and created the canonical `src/pages/admin/index.astro`.

### Schema Mismatch: README vs types.ts
*Resolved:* Updated `src/types.ts` to implement the multi-collection schema matching the Firestore database structure used by the codebase.

### AdminTemplate.astro is Empty
*Resolved:* Changed `src/pages/admin/index.astro` to directly use `AdminDashboard` components nested inside `AdminLayout`, rendering the page correctly without using the empty template.

### AdminDashboard.tsx Link Mismatch
*Resolved:* Standardized routes in `AdminDashboard.tsx` to target `/admin/admin_*` endpoints.

### Head.astro Redundant Color Import
*Resolved:* Cleaned up unused import and variable from `Head.astro` frontmatter.

### Hard-coded Google Client ID
*Resolved:* Removed fallback hardcoded credential string from `src/pages/admin/admin_login.astro`.

