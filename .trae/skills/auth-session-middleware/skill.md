---
name: auth-session-middleware
description: Admin authentication flow - Google GSI login, HMAC session tokens, cookie middleware, and logout.
triggers:
  - "authentication"
  - "login"
  - "session"
  - "middleware"
  - "cookie"
  - "admin auth"
---

# Authentication & Session Middleware

## Key Files

| File | Role |
|---|---|
| `src/pages/admin/admin_login.astro` | Login page + POST handler for Google GSI |
| `src/pages/admin/admin_logout.ts` | GET endpoint: clears cookie + redirects |
| `src/lib/server/session.ts` | `createSessionToken()` / `verifySessionToken()` |
| `src/middleware.ts` | Route guard for `/admin/*` |
| `src/env.d.ts` | `App.Locals` type augmentation |

## Flow

1. Admin visits `/admin/admin_login` → Google GSI renders sign-in button
2. GSI callback POSTs credential to same page
3. Server verifies token via `OAuth2Client.verifyIdToken()`
4. Checks `payload.email === ADMIN_EMAIL` env var
5. Creates HMAC-SHA256 session token, sets `admin_session` cookie (HttpOnly, Secure, 7-day)
6. Client redirects to `/admin`
7. Middleware reads cookie on every `/admin/*` request, verifies HMAC + expiry
8. Sets `Astro.locals.adminEmail` on success, redirects to login on failure

## Session Token

Format: `base64url(payload).base64url(HMAC-SHA256)`
Payload: `{ email: string, exp: number }`
Secret: `FIREBASE_PRIVATE_KEY` env var

## Admin Page Auth Check

```astro
---
const adminEmail = Astro.locals.adminEmail;
if (!adminEmail) return Astro.redirect("/admin/admin_login");
---
```

## Guardrails

- Never expose `ADMIN_EMAIL` or `FIREBASE_PRIVATE_KEY` client-side
- Cookie must use `path: '/'` for middleware to read it
- Logout must delete cookie with `path: '/'`
