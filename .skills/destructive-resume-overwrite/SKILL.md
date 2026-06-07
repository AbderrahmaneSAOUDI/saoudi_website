---
name: destructive-resume-overwrite
description: Governs the administrative sequence for managing the curriculum vitae PDF to guarantee zero ghost-file storage bloat.
triggers:
  - "upload resume"
  - "replace pdf"
  - "cv asset pipeline"
  - "delete asset"
---

# Destructive Resume Overwrite Pipeline

## System Context

The resume PDF is stored in Firebase Storage and its download URL is persisted in `configuration/static_data.resumeUrl`. The admin dashboard provides a UI to preview the current resume and upload a replacement. To prevent orphaned files and storage bloat on the Firebase Spark Plan, the replacement follows a **strict delete-then-upload transactional sequence**.

**Architectural references:**
- Admin island: `src/components/admin/` (React, `client:only="react"`)
- Firestore document: `configuration/static_data.resumeUrl`
- Source of truth: `README.md` → Architecture & Data Flow → Key Constraints

---

## Playbook

### 1 — Transactional Sequence (Non-Negotiable Order)

When updating the resume asset inside the administration platform, enforce this absolute asynchronous sequence:

```
Step A: deleteObject()  →  await confirmed completion
Step B: uploadBytes()   →  await confirmed completion
Step C: getDownloadURL() → await fresh URL
Step D: updateDoc()     →  sync URL to static_data.resumeUrl
```

### 2 — Reference Implementation

```typescript
import { ref, deleteObject, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';
import { db, storage } from '../lib/firebase-client';

async function replaceResume(newFile: File): Promise<string> {
  const storagePath = 'resume/cv.pdf';
  const storageRef = ref(storage, storagePath);

  // STEP A: Destructive delete — remove legacy asset FIRST
  try {
    await deleteObject(storageRef);
  } catch (error: any) {
    if (error.code !== 'storage/object-not-found') {
      throw new Error(`Failed to delete legacy file: ${error.message}`);
    }
    // File doesn't exist — acceptable, proceed to upload
  }

  // STEP B: Upload replacement — ONLY after delete completes
  const snapshot = await uploadBytes(storageRef, newFile, {
    contentType: 'application/pdf',
  });

  // STEP C: Get fresh download URL
  const downloadUrl = await getDownloadURL(snapshot.ref);

  // STEP D: Sync URL to Firestore
  await updateDoc(doc(db, 'configuration', 'static_data'), {
    resumeUrl: downloadUrl,
  });

  return downloadUrl;
}
```

### 3 — UI State Machine

The admin component must reflect each state transition:

```
IDLE → DELETING_OLD → UPLOADING_NEW → UPDATING_URL → SUCCESS | ERROR
```

Display progress indicators for each step so the admin understands the blocking nature.

### 4 — Post-Upload Validation

After the sequence completes, verify the new URL resolves:

```typescript
const response = await fetch(downloadUrl, { method: 'HEAD' });
if (!response.ok) {
  throw new Error('Post-upload validation failed: URL not accessible.');
}
```

---

## Hard Guardrails

- **BANNED:** Uploading a new resume **before** deleting the old one.
- **BANNED:** Running `deleteObject()` and `uploadBytes()` in parallel (`Promise.all`).
- **BANNED:** Silently swallowing delete errors (except `storage/object-not-found`).
- **BANNED:** Storing multiple resume versions — single file at `resume/cv.pdf`.
- **BANNED:** Skipping the Firestore `resumeUrl` update after upload.
- **BANNED:** Using this pipeline outside the `/admin` React island.
- **REQUIRED:** Sequence: `deleteObject` → `uploadBytes` → `getDownloadURL` → `updateDoc`.
- **REQUIRED:** Admin UI reflects each state transition.
- **REQUIRED:** Content type explicitly set to `application/pdf`.
