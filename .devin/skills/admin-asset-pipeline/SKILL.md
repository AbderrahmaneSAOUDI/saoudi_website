---
name: admin-asset-pipeline
description: Seals administrative CRUD actions inside an isolated React island and optimizes image assets client-side before storage dispatch.
triggers:
  - "admin island"
  - "client upload"
  - "compress image"
  - "compressorjs"
  - "dashboard input"
  - "crud form"
---

# Admin Asset Pipeline

## System Context

The `/admin` route is the **only** route permitted to load client-side JavaScript, the Firebase Client SDK, and React. It is mounted as an Astro island via `client:only="react"`. All image uploads pass through `compressorjs` for client-side optimization before dispatch to Firebase Storage. Compression settings are dynamically sourced from `static_data.imageSettings`.

**Architectural references:**

- Admin page: `src/pages/admin.astro`
- React components: `src/components/admin/`
- Firebase Client SDK: `src/lib/firebase-client.ts`
- Source of truth: `README.md` → Architecture & Data Flow
- API reference: `.skills/admin-asset-pipeline/references/compressorjs-docs.md`

---

## Playbook

### 1 — Workspace Isolation

All administrative controls, authentication logic, and media upload interfaces must live exclusively behind `/admin` as an isolated React island:

```astro
---
// src/pages/admin.astro — no frontmatter data fetching
---
<AdminDashboard client:only="react" />
```

- Use `client:only="react"` exclusively — never `client:load` or `client:visible`
- Zero React JS shipped to any other page
- No SSR hydration overhead for admin views

### 2 — Firebase Client SDK (Admin-Only Module)

Create `src/lib/firebase-client.ts` — this file must **never** be imported by public routes:

```typescript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const app = initializeApp({
  apiKey: import.meta.env.PUBLIC_FIREBASE_API_KEY,
  authDomain: import.meta.env.PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.PUBLIC_FIREBASE_STORAGE_BUCKET,
});

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
```

### 3 — In-Browser Compression

Intercept files dropped into admin media fields and pass through `compressorjs`. Convert and output to WebP:

```typescript
import Compressor from 'compressorjs';

async function compressImage(
  file: File,
  quality: number,
  maxWidth: number
): Promise<File> {
  return new Promise((resolve, reject) => {
    new Compressor(file, {
      quality: quality / 100,  // compressorjs expects 0–1
      maxWidth,
      mimeType: 'image/webp',
      success: (result) => resolve(result as File),
      error: reject,
    });
  });
}
```

### 4 — Dynamic Optimization Tracking

Compression configurations must dynamically inherit live values from `static_data.imageSettings`:

```typescript
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase-client';

const configDoc = await getDoc(doc(db, 'configuration', 'static_data'));
const { quality, maxWidth } = configDoc.data()?.imageSettings ?? {
  quality: 80,
  maxWidth: 1200,
};

// quality slider bounded 0.5–1.0 (maps from 50–100 in imageSettings)
// maxWidth as numeric pixel cap
```

### 5 — Upload After Compression

```typescript
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

async function uploadImage(file: File, entryId: string): Promise<string> {
  const compressed = await compressImage(file, quality, maxWidth);
  const storageRef = ref(storage, `entries/${entryId}/${compressed.name}`);
  await uploadBytes(storageRef, compressed, { contentType: compressed.type });
  return getDownloadURL(storageRef);
}
```

### 6 — Image Settings Panel

Provide UI controls for `imageSettings.quality` (slider) and `imageSettings.maxWidth` (numeric input):

```typescript
import { updateDoc, doc } from 'firebase/firestore';

async function updateImageSettings(quality: number, maxWidth: number) {
  await updateDoc(doc(db, 'configuration', 'static_data'), {
    'imageSettings.quality': quality,
    'imageSettings.maxWidth': maxWidth,
  });
}
```

---

## Hard Guardrails

- **BANNED:** Importing `firebase-client.ts` from any public route file.
- **BANNED:** Using `client:load`, `client:visible`, or `client:idle` — must be `client:only="react"`.
- **BANNED:** Uploading uncompressed images to Firebase Storage.
- **BANNED:** Hardcoding compression quality/maxWidth — must read from `static_data.imageSettings`.
- **BANNED:** Loading React or Firebase Client SDK on any route other than `/admin`.
- **REQUIRED:** All images converted to WebP via `compressorjs` before upload.
- **REQUIRED:** CRUD operations validate against the `PortfolioEntry` TypeScript interface.
- **REQUIRED:** Image dropzone handlers call `compressImage()` before `uploadBytes()`.
