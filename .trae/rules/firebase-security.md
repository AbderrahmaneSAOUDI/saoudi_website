---
trigger: always_on
---
# Firebase & Security Rules

## Authentication Flow

1. Admin login uses **Google Sign-In (GSI)** on `/admin/admin_login`.
2. The server verifies the Google ID token via `google-auth-library`'s `OAuth2Client.verifyIdToken()`.
3. The server checks the verified email against the `ADMIN_EMAIL` environment variable.
4. On success, a HMAC-SHA256 signed session token is created via `src/lib/server/session.ts` and set as an `admin_session` cookie (HttpOnly, Secure, SameSite=Lax, 7-day expiry).
5. Middleware (`src/middleware.ts`) intercepts all `/admin/*` routes (except `/admin/admin_login`), reads the cookie, verifies the HMAC signature, and checks expiration.
6. Invalid/missing cookies redirect to `/admin/admin_login`.

## Environment Variables (Never Expose)

- `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`, `FIREBASE_STORAGE_BUCKET` — server-only.
- `ADMIN_EMAIL` — server-only, determines who can log in.
- `GOOGLE_CLIENT_ID` — may appear in client-side GSI script (this is expected).
- The `.env` file is gitignored. Only `.env.example` is committed.

## Firebase Admin SDK

- Singleton initialization in `src/lib/server/firebase-admin.ts`.
- Private key newlines are unescaped: `.replace(/\\n/g, '\n')`.
- Exports: `getFirebaseAdminApp()`, `getFirebaseAdminAuth()`, `getFirebaseAdminDb()`, `getFirebaseAdminStorage()`.
- Used exclusively in Astro frontmatter and API endpoints (server-side only).

## Firestore Security Rules (Planned)

- All reads: open (`allow read: if true`) — public data is served via Admin SDK anyway.
- All writes: restricted to admin UID (`allow write: if request.auth.uid == '<ADMIN_UID>'`).
- Catch-all deny for unmapped paths.

## Storage Deletion Policy

- When deleting a document with an `imageUrl`, call `deleteObject()` on the Storage file BEFORE deleting the Firestore document.
- When replacing an image, delete the old Storage file BEFORE uploading the new one.
- Resume PDF updates follow the same atomic delete-then-upload sequence.

## Hard Bans

- Never commit `.env` or expose Firebase credentials in client-side code.
- Never use `request.auth.token.email` for write authorization in Firestore rules — must use `request.auth.uid`.
- Never allow wildcard write rules (`allow write: if true` or `allow write: if request.auth != null`).
