---
name: m3-google-theming
description: Controls styling and ensures strict adherence to Material 3 Dark Mode rules using ONLY the official Google Brand Colors and hardware-accelerated animations.
triggers:
  - "style layout"
  - "tailwind"
  - "colors"
  - "theme"
  - "css animation"
  - "hover state"
  - "visuals"
---

# M3 Google Brand Theming

## System Context

This project is a Material 3 (M3) Dark-Mode portfolio built with Astro SSR + Tailwind CSS. The visual system is **strictly constrained** to four official Google Brand Colors adapted for dark-mode readability. All animation must be CSS-native. No client-side JS frameworks or animation libraries are permitted on public routes.

**Architectural references:**

- Token definitions: `tailwind.config.*` and `src/styles/global.css`
- Source of truth: `README.md` → Design System & Visual Rules

---

## Playbook

### 1 — Color Palette Constraint

Restrict the color spectrum entirely to official Google Brand Colors, mapped to Material 3 Dark Theme roles at high-contrast tonal levels:

| M3 Role | Source | Dark-Mode Tone (80–90) | CSS Token |
| --------- | -------- | ---------------------- | ----------- |
| **Primary / Accent** | Google Blue | `#8AB4F8` | `--md-sys-color-primary` |
| **Secondary / Success** | Google Green | `#81C995` | `--md-sys-color-secondary` |
| **Tertiary / Warning** | Google Yellow | `#FDE293` | `--md-sys-color-tertiary` |
| **Error** | Google Red | `#F28B82` | `--md-sys-color-error` |

On-color labels (e.g., `--md-sys-color-on-primary`) must use deep tones (10–20) from the same hue for contrast. All tokens declared in Tailwind config as CSS custom properties.

### 2 — Background & Canvas

Use a solid, deep dark baseline:

```css
:root {
  --md-sys-color-background: #141218;
  --md-sys-color-surface-container-low: #1D1B20;
  --md-sys-color-surface-container: #211F26;
  --md-sys-color-surface-container-high: #2B2930;
}
```

- **Completely eliminate** all glassmorphism elements, `backdrop-filter: blur()`, or gradient backgrounds.
- Component cards must use **solid** surfaces matching M3 elevation tiers.

### 3 — Geometry

Enforce fully rounded M3 curvature:

| Element Type | Tailwind Class | Radius |
| ------------- | ---------------- | -------- |
| Bento grid panels, hero cards, primary containers | `rounded-3xl` | 24px |
| Interactive items, chips, badges, buttons | `rounded-xl` | 12px |

Never use `rounded-none` on layout panels or `rounded-full` on non-avatar elements.

### 4 — Animations (CSS & Tailwind Only)

**Ambient background motion** — define in `src/styles/global.css`:

```css
@keyframes float-shape {
  0%, 100% { transform: translateY(0) rotate(0deg); opacity: 0.03; }
  50% { transform: translateY(-20px) rotate(180deg); opacity: 0.06; }
}
```

Shapes must use only soft Google brand tones at opacity 0.02–0.08.

**Hover & interaction states** — every interactive element:

```html
class="transition-all duration-300 ease-in-out hover:-translate-y-1.5 hover:shadow-lg hover:ring-2 hover:ring-primary/40 hover:bg-[rgba(138,180,248,0.06)]"
```

**Entrance animations** — staggered via CSS `animation-delay`, never JS:

```css
@keyframes fade-in-up {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}
.stagger-1 { animation: fade-in-up 0.5s cubic-bezier(0.2, 0, 0.2, 1) 0.1s both; }
.stagger-2 { animation: fade-in-up 0.5s cubic-bezier(0.2, 0, 0.2, 1) 0.2s both; }
.stagger-3 { animation: fade-in-up 0.5s cubic-bezier(0.2, 0, 0.2, 1) 0.3s both; }
```

### 5 — Contrast & Accessibility

Ensure WCAG AA contrast (4.5:1 minimum) for all text against the `#141218` baseline. Use Tone 80–90 variants for readable labels on dark surfaces.

---

## Hard Guardrails

- **BANNED:** Framer Motion, GSAP, Animate.css, Lottie, or any third-party animation library on public pages.
- **BANNED:** Dynamic masonry layout libraries (e.g., `react-masonry-css`, `isotope`).
- **BANNED:** Translucent / glassmorphism surfaces, `backdrop-filter: blur()`, gradient backgrounds.
- **BANNED:** Colors outside the four Google Brand hues and their tonal derivatives.
- **BANNED:** Pure black (`#000000`) as a background or surface.
- **BANNED:** JavaScript-driven animation staggering on public routes.
- **REQUIRED:** Every hover state includes `transition-all duration-300` at minimum.
- **REQUIRED:** M3 easing `cubic-bezier(0.2, 0.0, 0.2, 1)` for entrance animations.
- **REQUIRED:** All color tokens declared as CSS custom properties mapped in Tailwind config.
