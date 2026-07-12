---
name: firestore-data-operations
description: Patterns for reading and writing Firestore data using the Admin SDK on server-side and Client SDK on admin React islands.
triggers:
  - "firestore"
  - "database"
  - "collection"
  - "query data"
  - "fetch entries"
  - "crud operations"
  - "read firestore"
  - "write firestore"
---

# Firestore Data Operations

## When to Use

When reading or writing data to/from Firebase Firestore.

## Current Data Schema

The project follows a multi-collection schema:
- `configuration` → single document `static_data` (`StaticData` interface)
- `projects` → Showcase items (`Project` interface)
- `experience` → Professional timeline events (`Experience` interface)
- `designs` → Figma mockups and category tags (`Design` interface)
- `certificates` → Credentials and links (`Certificate` interface)
- `volunteering` → GDG and community efforts (`Volunteering` interface)

All portfolio data is typed and validated using Zod schemas defined in `src/types.ts`.

## Server-Side Read Pattern (Public Pages)

```typescript
// In Astro frontmatter
import { getFirebaseAdminDb } from '../lib/server/firebase-admin';

const db = getFirebaseAdminDb();

// Single document
const configDoc = await db.collection('configuration').doc('static_data').get();
const config = configDoc.data() as StaticData;

// Collection query
const snapshot = await db.collection('experience').orderBy('date', 'desc').get();
const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

// Count query (used in admin dashboard)
const countSnap = await db.collection('projects').count().get();
const count = countSnap.data().count;

// Parallel fetching
const [projectsSnap, experienceSnap] = await Promise.all([
  db.collection('projects').count().get(),
  db.collection('experience').count().get(),
]);
```

## Client-Side Write Pattern (Admin React Islands)

```typescript
// Only in React components loaded via client:only="react"
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';

const app = initializeApp({ /* client config */ });
const db = getFirestore(app);

// Create
await addDoc(collection(db, 'projects'), newProjectData);

// Update
await updateDoc(doc(db, 'projects', projectId), updatedFields);

// Delete (with Storage cleanup!)
// 1. Delete the Storage file first
// 2. Then delete the Firestore document
await deleteDoc(doc(db, 'projects', projectId));
```

## Zod Validation

```typescript
import { parseStaticData, parseProject, isValidStaticData } from '../types';

// Validate configuration before saving
const validatedConfig = parseStaticData(rawData); // throws on invalid

// Validate project before saving
const validatedProject = parseProject(rawProjectData);

// Safe check
if (isValidStaticData(data)) {
  // data is typed as StaticData
}
```

## Edge Caching

Always set cache headers on public routes to protect Spark Plan quotas:

```typescript
Astro.response.headers.set('Cache-Control', 'public, max-age=0, s-maxage=300');
```

## Guardrails

- Server-side: ONLY use `firebase-admin` SDK via `getFirebaseAdminDb()`
- Client-side: ONLY use Firebase Client SDK inside admin React islands
- Always type-assert Firestore data immediately after retrieval
- Always handle `try/catch` for Firestore operations with graceful fallbacks

