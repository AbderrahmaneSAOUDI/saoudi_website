---
name: clean-code-simplicity
description: Audits code architectures for performance and layout stability, eliminating layouts that introduce cumulative shifts or bloating scripts.
triggers:
  - "optimize component"
  - "code review"
  - "refactor layout"
  - "check simplicity"
---

# Clean Code Simplicity

## System Context

This project prioritizes simplicity: Tailwind utilities over custom CSS, native HTML over complex components, and zero unnecessary dependencies. Every layout, transition, and interaction must be evaluated against a "can Tailwind do this?" test before writing custom code. Performance targets include zero CLS (Cumulative Layout Shift) and Lighthouse ≥ 90.

**Architectural references:**

- Source of truth: `README.md` → Architectural Manifest

---

## Playbook

### 1 — Simplicity Threshold

Before marking any structural script block complete, evaluate if layouts, alignments, or animations can be entirely satisfied using native Tailwind parameters or under 20 lines of vanilla JavaScript.

Always check:

1. Can Tailwind utilities handle this layout? (grid, flex, gap, padding, margin)
2. Can Tailwind handle this transition? (`transition-all`, `duration-300`, `ease-in-out`)
3. Can Tailwind handle this hover state? (`hover:`, `focus:`, `active:` variants)
4. Is this achievable with under 20 lines of vanilla JS?

If **yes** to any, use the native solution. If **no** to all, write minimal custom CSS in `global.css`.

### 2 — Visual Grid Parameters (CLS Prevention)

Mandate the use of fixed, explicit aspect ratios on all image containers (`aspect-video`, `aspect-square`, `aspect-[4/3]`) to ensure total layout boundaries remain locked, completely eliminating Cumulative Layout Shifts (CLS) from dynamic content rendering.

```html
<!-- ✅ Correct: fixed aspect ratio prevents CLS -->
<div class="aspect-video w-full overflow-hidden rounded-3xl">
  <img src={imageUrl} alt={title} class="h-full w-full object-cover" loading="lazy" />
</div>

<!-- ❌ WRONG: no aspect ratio = CLS risk -->
<img src={imageUrl} alt={title} class="w-full rounded-3xl" />
```

---

## Hard Guardrails

- **BANNED:** Masonry libraries (`react-masonry-css`, `isotope`, `packery`).
- **BANNED:** Complex grid/presentation libraries (`swiper`, `splide`, `embla-carousel`) on public routes.
- **BANNED:** Custom CSS that duplicates existing Tailwind utilities.
- **BANNED:** Images or dynamic content containers without fixed aspect ratios.
- **BANNED:** Public-route components exceeding 20 lines of vanilla JS (excluding `atob()` decoder).
- **BANNED:** React components on public routes.
- **REQUIRED:** All layouts must use Tailwind grid/flex utilities as the first option.
- **REQUIRED:** Fixed `aspect-*` classes on all image/video wrappers.
- **REQUIRED:** Target Lighthouse Performance score ≥ 90.
