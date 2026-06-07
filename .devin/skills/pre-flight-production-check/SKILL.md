---
name: pre-flight-production-check
description: Runs automated verification routines to confirm web compliance, environment separation, and asset structures before deployment.
triggers:
  - "preflight check"
  - "before deploy"
  - "audit project"
  - "production build"
  - "compliance check"
---

# Pre-Flight Production Check

## System Context

This checklist is the final quality assurance pass before deploying to production on Vercel. It verifies environment security, asset integrity, performance targets (Lighthouse ≥ 90), responsive layout quality, and architectural compliance with all project constraints.

**Architectural references:**
- Source of truth: `README.md` → Roadmap Phase 4
- Script: `.skills/pre-flight-production-check/scripts/audit.sh`

---

## Playbook

### 1 — Pre-Flight Validation Loop

Before approving any codebase merge or pushing live changes to production, execute a comprehensive validation audit. Ensure your local `.env` keys are fully gitignored, essential files (favicon, PWA `manifest.json`) are intact, and the system architecture complies with a Lighthouse web performance target score of 90 or higher, outputting fluid hardware-accelerated animations running at 60fps.

Steps:
1. Run `./.skills/pre-flight-production-check/scripts/audit.sh` to check gitignore status and favicon presence.
2. Run `npm run build` and ensure there are no compilation errors.
3. Test that there are no unauthorized client-side script tags on public routes (0 KB client JS budget check).
4. Run lighthouse checks to verify Performance, Accessibility, Best Practices, and SEO are all ≥ 90.

---

## Hard Guardrails

- **BANNED:** Deploying with `.env` files committed to git.
- **BANNED:** Deploying with Lighthouse scores below 90 in any category.
- **BANNED:** Deploying with the `YOUR_EXACT_ADMIN_UID` placeholder in security rules.
- **BANNED:** Deploying without `favicon.ico`, `og-default.png`, or `robots.txt`.
- **BANNED:** Deploying with `<script>` tags on public routes (except `atob()` decoder).
- **REQUIRED:** Clean `npm run build` with zero errors before any deploy.
- **REQUIRED:** All Lighthouse categories ≥ 90.
- **REQUIRED:** Responsive layout verified at 320px, 425px, 768px, 1024px, 1440px.
- **REQUIRED:** All CSS animations verified at 60fps.
