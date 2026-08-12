---
trigger: always_on
---
# Design System Rules

All visual output must comply with these Material 3 Dark Mode constraints.

## Color Palette (Strict Google Brand Colors)

| Role | Color Name | Hex Code | CSS Token |
| --- | --- | --- | --- |
| Primary / Accent | Google Blue | `#4285F4` | `--color-primary` |
| Secondary / Success | Google Green | `#34A853` (or `#0F9D58`) | `--color-secondary` |
| Tertiary / Warning | Google Yellow | `#F9AB00` (or `#F4B400`) | `--color-tertiary` |
| Error / Alert | Google Red | `#EA4335` (or `#DB4437`) | `--color-error` |

### Surfaces (M3 Dark Baseline)

| Surface Level | Hex | Tailwind Token |
| --- | --- | --- |
| Background | `#121212` | `bg-surface` |
| Container | `#1E1E1E` | `bg-surface-container` |
| Container High | `#2D2D2D` | `bg-surface-container-high` |

### Typography Colors

- Primary text: `#FFFFFF` (white)
- Secondary text: `#E6E1E5` (M3 on-surface)
- Muted text: `white/60` or `white/70` opacity variants

## Geometry

- Primary panels, cards, hero containers: `rounded-3xl`
- Buttons, chips, badges, inputs: `rounded-xl`
- Pill-shaped navigation items, action buttons: `rounded-full`
- Never use `rounded-none` on layout panels.

## Shadow Ban (Absolute)

- This ban applies to every AI agent and every generated, modified, or recommended interface.
- Never use visual shadows of any kind, including CSS `box-shadow`, `text-shadow`, `filter: drop-shadow()`, SVG `<feDropShadow>`, or shadow-producing Tailwind utilities such as `shadow`, `shadow-*`, and `drop-shadow-*`.
- Do not preserve or reintroduce a shadow in any interface area you modify; remove any existing shadow from the directly affected markup or styles.
- Express hierarchy, elevation, focus, and hover feedback with solid surface-container tones, borders, rings, color changes, or transforms instead.

## Animations (CSS & Tailwind Only)

- All animations use CSS `@keyframes` or Tailwind utility classes.
- Every interactive element must include `transition-all duration-300` minimum.
- Hover states use shadow-free feedback: `hover:-translate-y-1.5`, `hover:ring-2 hover:ring-primary/40`, and solid surface-tone changes.
- Entrance animations use staggered CSS `animation-delay`, never JavaScript.
- M3 easing: `cubic-bezier(0.2, 0.0, 0.2, 1)` for entrance animations.
- Background ambient motion is defined in `src/styles/background_animation.css`.

## Hard Bans

- No light themes, no light-mode media queries, no theme toggles.
- No glassmorphism (`backdrop-filter: blur()`) on content surfaces.
- No gradient backgrounds on content cards (allowed on subtle hover glow overlays).
- No colors outside Google Brand hues and their tonal derivatives.
- No pure black (`#000000`) as a background.
- No JavaScript-driven animation on public routes.
- No visual shadows, glows implemented as shadows, or shadow-based elevation.
