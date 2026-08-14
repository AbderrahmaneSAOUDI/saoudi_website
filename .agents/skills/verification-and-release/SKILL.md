---
name: verification-and-release
description: Standard procedure for end-of-task verification, static typechecking, production builds, silent version increment, and atomic git commit & push.
triggers:
  - "verify"
  - "run checks"
  - "release"
  - "finish prompt"
  - "git push"
---

# Verification and Release Playbook

## When to Use
Execute this sequence at the conclusion of every coding task / user prompt before providing the final answer.

## Workflow Sequence

### 1. Static Verification
Run static checking to ensure no TypeScript or Astro diagnostic errors exist:
```bash
pnpm run check
```

### 2. Production Build
Verify the Vercel serverless build bundles properly:
```bash
pnpm run build
```

### 3. Silent Version Bump
Calculate the minor and patch version for `package.json`:
- **Minor version:** `floor((Current Date - 2026-06-01) in days)`.
- **Patch version:** Increment by 1 from the current value in `package.json`.
- **Rule:** Perform this update silently in `package.json` without mentioning it in conversational responses to the user.

### 4. Git Stage, Commit & Push
Stage all modified, added, and deleted files:
```bash
git add .
git commit -m "updated project version: <concise summary of changes>"
git push
```
- Commit message MUST start with `updated project version` or `chore: bump version`.
