---
name: admin-api-endpoint
description: Playbook for creating secure, authenticated admin API endpoints in src/pages/admin/ with session guards, Zod validation, and structured audit logs.
triggers:
  - "create admin api"
  - "admin endpoint"
  - "admin_api"
  - "api handler"
---

# Admin API Endpoint Playbook

## When to Use

Use when creating or updating any server-side API endpoint under `src/pages/admin/` (e.g. `src/pages/admin/admin_<resource>_api.ts`).

## Rules & Standards

1. **Filename Convention:** File MUST be named `admin_<resource>_api.ts` under `src/pages/admin/`.
2. **Session Guard:** Always enforce authentication using `requireAdminSession(context)` from `src/lib/server/api-guards.ts`.
3. **Response Formatting:** Always return responses using `jsonResponse()` from `src/lib/server/http.ts`.
4. **Validation:** Always validate request payloads using Zod schemas from `src/types.ts`.
5. **Audit Logging:** Record meaningful mutations (create, update, delete) in Firestore using `addSystemLog()` from `src/lib/server/system-logs.ts`.
6. **Cache Invalidation:** Call `invalidateCache()` from `src/lib/server/cache.ts` when mutating data that affects public or admin cached lists.

## Standard Implementation Template

```typescript
import type { APIRoute } from 'astro';
import { getFirebaseAdminDb } from '../../../lib/server/firebase-admin';
import { requireAdminSession } from '../../../lib/server/api-guards';
import { jsonResponse } from '../../../lib/server/http';
import { invalidateCache, CACHE_TTL_MS } from '../../../lib/server/cache';
import { addSystemLog } from '../../../lib/server/system-logs';
import { itemSchema } from '../../../types';

export const POST: APIRoute = async (context) => {
  // 1. Enforce Admin Session
  const session = await requireAdminSession(context);
  if (!session.authorized) {
    return session.response;
  }

  try {
    // 2. Parse & Validate Payload
    const body = await context.request.json();
    const parsed = itemSchema.safeParse(body);
    if (!parsed.success) {
      return jsonResponse({ error: 'Validation failed', details: parsed.error.format() }, 400);
    }

    // 3. Perform Firestore Mutation
    const db = getFirebaseAdminDb();
    const docRef = await db.collection('items').add({
      ...parsed.data,
      createdAt: new Date().toISOString(),
      updatedBy: session.email,
    });

    // 4. Invalidate Cache
    invalidateCache('items_list');

    // 5. Record Audit System Log
    await addSystemLog({
      type: 'content',
      severity: 'info',
      action: 'ITEM_CREATED',
      title: `Created item ${parsed.data.title}`,
      userEmail: session.email,
      targetCollection: 'items',
      targetDocId: docRef.id,
      changeType: 'create',
    });

    return jsonResponse({ success: true, id: docRef.id }, 201);
  } catch (error) {
    console.error('Error creating item:', error);
    return jsonResponse({ error: 'Internal Server Error' }, 500);
  }
};
```
