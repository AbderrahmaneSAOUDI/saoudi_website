---
name: firestore-twin-schema
description: Restricts database interactions strictly to the twin-collection layout and enforces compile-time TypeScript type literal constraints.
triggers:
  - "database schema"
  - "firestore type"
  - "collection layout"
  - "data interface"
  - "typescript interface"
---

# Firestore Twin-Collection Schema

## System Context

This project uses Firebase Firestore with the Admin SDK (server-side only on public routes). The data model is intentionally flat: exactly **two collections**, no subcollections, no denormalization. All portfolio content lives in a single `entries` collection differentiated by a strict TypeScript literal `type` field. Site configuration lives in a single `configuration` document.

**Architectural references:**

- TypeScript interfaces: `src/types.ts`
- Source of truth: `README.md` → Firebase Data Schema

---

## Playbook

### 1 — Flattened Layout: Two Collections Only

#### Collection 1: `configuration` (singleton document `static_data`)

Stores global site settings, profile info, and persistent admin configurations:

```typescript
// src/types.ts
interface StaticData {
  name: string;
  title: string;
  bio: string;
  skills: string[];
  resumeUrl: string;
  contact: {
    email: string;       // stored plain-text; Base64-obfuscated at render time
    telegram: string;
    whatsapp: string;
  };
  imageSettings: {
    quality: number;     // 0–100, used by compressorjs in admin
    maxWidth: number;    // max pixel width for uploaded images
  };
}
```

#### Collection 2: `entries` (dynamic, all portfolio items)

Unified collection for all portfolio content:

```typescript
// src/types.ts
interface PortfolioEntry {
  id: string;
  type: 'project' | 'experience' | 'volunteering' | 'certificate';
  title: string;
  description: string;
  dateOrPeriod: string;
  imageUrl?: string;
  tags?: string[];
}
```

### 2 — Type Literal Safety

Every document written to or read from the `entries` collection must be bound to the exact literal string type constraint. No enums, no loose strings, no indirection:

```typescript
// ✅ Correct — inline literal
const entry: PortfolioEntry = {
  id: '...',
  type: 'project',  // literal string
  title: '...',
  description: '...',
  dateOrPeriod: '...',
};

// ❌ BANNED — enum or constant indirection
enum EntryType { PROJECT = 'project' }  // BANNED
const TYPE = 'project';                  // BANNED as type source
```

### 3 — Exact Collection Paths

Always reference collection names in their exact singular form:

```typescript
// ✅ Correct
const entriesRef = db.collection('entries');
const configRef  = db.collection('configuration').doc('static_data');

// ❌ BANNED — never pluralize, alias, or abbreviate
db.collection('entry');            // WRONG
db.collection('portfolioItems');   // WRONG
db.collection('config');           // WRONG
db.collection('settings');         // WRONG
```

### 4 — Compile-Time Validation

All Firestore data must be cast through TypeScript interfaces immediately after retrieval:

```typescript
const doc = await configRef.get();
const data = doc.data() as StaticData;

const snapshot = await entriesRef.where('type', '==', 'certificate').get();
const certs: PortfolioEntry[] = snapshot.docs.map(d => ({
  id: d.id,
  ...d.data()
} as PortfolioEntry));
```

---

## Hard Guardrails

- **BANNED:** Creating any collection beyond `configuration` and `entries`.
- **BANNED:** Subcollections, nested documents, or denormalized duplicates.
- **BANNED:** Enum types for the `type` field — must use the literal union only.
- **BANNED:** Pluralized, aliased, or abbreviated collection paths.
- **BANNED:** Storing more than one document in the `configuration` collection.
- **BANNED:** Adding fields without updating `src/types.ts`, `README.md`, and `GEMINI.md` simultaneously.
- **REQUIRED:** All Firestore reads on public routes must use the Firebase Admin SDK.
- **REQUIRED:** Immediate TypeScript type assertion on all Firestore data retrieval.
