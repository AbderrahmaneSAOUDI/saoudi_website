---
name: firebase-security-guardrails
description: Automates the auditing of access rules, locking down global write paths to your exact administrative UID identifier.
triggers:
  - "security rules"
  - "firestore.rules"
  - "storage.rules"
  - "write access"
  - "lock down database"
---

# Firebase Security Guardrails

## System Context

This project uses Firebase Firestore and Firebase Storage. Public visitors read data via server-rendered pages (Admin SDK bypasses rules). The admin user writes data via the Firebase Client SDK from the `/admin` React island. Security rules must allow **open reads** but restrict all **writes to a single admin UID**.

**Architectural references:**

- Source of truth: `README.md` → Admin Security
- Assets:
  - `.skills/firebase-security-guardrails/assets/firestore.rules`
  - `.skills/firebase-security-guardrails/assets/storage.rules`

---

## Playbook

### 1 — Database Rules Enforcement

Enforce wide open public reading loops across all pathways, but unconditionally restrict all write, write-update, delete, or create threads exclusively to an administrative authorization check verifying matching parameters against your hard-coded UID configuration signature (`YOUR_EXACT_ADMIN_UID`).

Verify these mappings inside `firestore.rules` and `storage.rules` before deployment.

### 2 — Replace the UID Placeholder

Replace `YOUR_EXACT_ADMIN_UID` with the actual Firebase Auth UID of the admin user. This UID is obtained from:

```bash
# Firebase Console → Authentication → Users → copy the UID
```

Never use email-based checks or dynamic auth state checks that do not verify the specific, hard-coded UID.

---

## Hard Guardrails

- **BANNED:** Allowing write access to any user other than the hard-coded admin UID.
- **BANNED:** Using `request.auth.token.email` for write authorization — must use `request.auth.uid`.
- **BANNED:** Wildcard write rules (`allow write: if true` or `allow write: if request.auth != null`).
- **BANNED:** Deploying rules with the placeholder `YOUR_EXACT_ADMIN_UID` still present.
- **REQUIRED:** All read operations must be unconditionally open (`allow read: if true`).
- **REQUIRED:** All write operations must check `request.auth.uid == '<ADMIN_UID>'`.
- **REQUIRED:** A catch-all deny rule for unmapped paths.
