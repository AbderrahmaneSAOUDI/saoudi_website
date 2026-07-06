---
name: pre-build-validation
description: Validation checks to run before building the project for deployment.
trigger: pre_build
---

# Pre-Build Validation Hook

## Checks to Perform Before `pnpm run build`

### 1. Route Collision Check

Ensure no duplicate route definitions exist:

```bash
# Check for admin route collision
ls -la src/pages/admin.astro src/pages/admin/index.astro 2>/dev/null
# If both exist, one must be removed
```

### 2. Zero-JS Verification

After build, scan public pages for unintended script tags:

```bash
pnpm run build
grep -r '<script' dist/ --include='*.html' | grep -v '/admin' | grep -v 'atob'
# Expected: empty output (no scripts on public pages)
```

### 3. Environment Variables Check

Verify required env vars are set before deployment:

```bash
for var in FIREBASE_PROJECT_ID FIREBASE_CLIENT_EMAIL FIREBASE_PRIVATE_KEY ADMIN_EMAIL GOOGLE_CLIENT_ID; do
  if [ -z "${!var}" ]; then
    echo "ERROR: $var is not set"
    exit 1
  fi
done
```

### 4. TypeScript Check

```bash
pnpm astro check
```

### 5. Missing File References

Check that all imported components and pages exist:

```bash
# Verify no broken imports to admin pages
find src/pages/admin -name '*.astro' -o -name '*.ts' | sort
```

### 6. Image Domain Whitelist

Verify `firebasestorage.googleapis.com` is whitelisted in `astro.config.mjs` if remote images are used.
