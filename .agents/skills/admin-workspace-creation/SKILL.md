---
name: admin-workspace-creation
description: Playbook for creating new admin workspace pages following the 66%/33% master-detail pattern with AdminLayout and AdminNavDock.
triggers:
  - "admin page"
  - "admin workspace"
  - "admin crud"
  - "dashboard page"
  - "admin panel"
  - "manage content"
---

# Admin Workspace Page Creation

## When to Use

When building or modifying any page under `src/pages/admin/`.

## Architecture Context

- Admin pages use `BackgroundBaseLayout.astro` (no public header/footer).
- They include `AdminLayout.astro` for the admin header + sign-out.
- They include `AdminNavDock.astro` for the floating bottom navigation dock.
- The middleware in `src/middleware.ts` protects all `/admin/*` except `/admin/admin_login`.
- Files are named with `admin_` prefix: `admin_<name>.astro`.

## Playbook

### Step 1 — Create the Admin Page

```astro
---
// src/pages/admin/admin_<name>.astro
import BackgroundBaseLayout from "../../layouts/BackgroundBaseLayout.astro";
import AdminLayout from "../../components/admin/AdminLayout.astro";
import AdminNavDock from "../../components/admin/AdminNavDock.astro";
import { getFirebaseAdminDb } from "../../lib/server/firebase-admin";

// Double-check authentication
const adminEmail = Astro.locals.adminEmail;
if (!adminEmail) return Astro.redirect("/admin/admin_login");

// Fetch data
const db = getFirebaseAdminDb();
// ... fetch collection data
---

<BackgroundBaseLayout title="<Name> Workspace">
  <AdminLayout>
    <!-- 66% / 33% Split Layout -->
    <div class="flex gap-6">
      <!-- Left Column: List/Grid (66%) -->
      <div class="w-2/3">
        <!-- Search/filter strip -->
        <!-- Card list/grid -->
      </div>

      <!-- Right Column: Detail Editor (33%) -->
      <div class="w-1/3">
        <!-- Edit form -->
        <!-- Save (Google Green) and Delete (Google Red) buttons -->
      </div>
    </div>
  </AdminLayout>
  <AdminNavDock currentPath={Astro.url.pathname} />
</BackgroundBaseLayout>
```

### Step 2 — Apply Admin Design Tokens

- Background: `#141218` (set by AdminLayout)
- Cards: `bg-[#1D1B20]`, `border border-[#2B2930]`, `rounded-3xl`
- Active indicators: `bg-[#4285F4]` (Google Blue pill)
- Success/Save buttons: `bg-[#0F9D58]` (Google Green)
- Delete buttons: `border border-[#DB4437]/40 hover:bg-[#DB4437]`
- Text: `text-white` (headings), `text-[#E6E1E5]` (body), `text-[#E6E1E5]/50` (muted)

### Step 3 — Register in AdminNavDock

Update `src/components/admin/AdminNavDock.astro`:

```typescript
// Add to navItems array
{ label: '<Name>', path: '/admin/admin_<name>' },

// If it supports creation, add to createOptions array
{ label: '<Name>', path: '/admin/admin_<name>' },
```

### Step 4 — For React Islands (CRUD)

When the page needs client-side interactivity:

```astro
---
import AdminReactComponent from "../../components/admin/AdminReactComponent.tsx";
---

<AdminReactComponent client:only="react" data={serverFetchedData} />
```

## 66/33 Master-Detail UI Pattern

- **Left (66%):** Compact card list or data grid. Clicking a card updates URL query params via `history.pushState`.
- **Right (33%):** Full-height edit form. Contains input fields, Google Green "Save" button, Google Red "Delete" button.
- **Top strip:** Search input + Grid/List view toggle.

## Checklist

- [ ] File named `admin_<name>.astro` in `src/pages/admin/`
- [ ] Wrapped in `BackgroundBaseLayout` + `AdminLayout`
- [ ] `AdminNavDock` included with correct `currentPath`
- [ ] Authentication check in frontmatter
- [ ] Registered in `AdminNavDock` navItems
- [ ] 66/33 split layout implemented
- [ ] Google brand colors for action buttons
