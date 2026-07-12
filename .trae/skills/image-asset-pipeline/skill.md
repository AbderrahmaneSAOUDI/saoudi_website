---
name: image-asset-pipeline
description: Image upload, compression, storage, and optimization patterns for admin-managed assets.
triggers:
  - "image upload"
  - "compressorjs"
  - "firebase storage"
  - "image optimization"
  - "file upload"
  - "asset management"
---

# Image & Asset Pipeline

## Image Flow

1. Admin uploads image via dropzone in React island
2. Client-side file size validation (max 10MB before compression)
3. Client-side compression via `compressorjs` using settings from `configuration/static_data.imageSettings`
4. Direct upload to Firebase Storage (NOT proxied through Astro server — Vercel 10s timeout)
5. Get download URL and save to Firestore document's `imageUrl` field
6. Public pages serve images via Astro `<Image />` or `<img>` with CDN cache headers

## Storage Deletion Policy

**When deleting a document:**
1. Extract `imageUrl` from the document
2. Call `deleteObject()` on the Storage file path
3. THEN delete the Firestore document

**When replacing an image:**
1. Call `deleteObject()` on the old image path
2. Upload the new image
3. Update `imageUrl` in Firestore

## Configuration Document

```typescript
imageSettings: {
  quality: number;  // 1-100 for compressorjs
  maxWidth: number; // max pixel width
}
```

Stored in `configuration/static_data` Firestore document.
Editable via the Image Optimization Modal in `AdminNavDock.astro`.

## Astro Config for Remote Images

```javascript
// astro.config.mjs — must whitelist Firebase Storage
export default defineConfig({
  image: {
    domains: ['firebasestorage.googleapis.com'],
  },
});
```

## Cache Headers

```
Cache-Control: public, max-age=31536000, immutable
```

Set via Vercel config for image assets to minimize edge compute.

## Resume PDF Pipeline

- Upload restricted to `.pdf` extension only
- Atomic sequence: `deleteObject()` old → `uploadBytes()` new → update `resumeUrl`
