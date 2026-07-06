---
name: css-animation-system
description: Reference for the project's CSS-only animation infrastructure including ambient backgrounds, hover effects, and entrance transitions.
triggers:
  - "animation"
  - "css keyframes"
  - "hover effect"
  - "transition"
  - "entrance animation"
  - "background motion"
  - "stagger"
---

# CSS Animation System

## When to Use

When adding, modifying, or debugging animations on any page.

## Architecture

All animations are pure CSS — no JavaScript animation libraries allowed.

### Files

| File | Purpose |
|---|---|
| `src/styles/global.css` | Tailwind v4 `@theme` tokens + responsive utility overrides |
| `src/styles/background_animation.css` | Ambient dot/star background `@keyframes` on `body::before` and `body::after` |
| Page-scoped `<style>` blocks | Page-specific entrance animations (e.g., `index.astro`) |

### Background Animation

Defined in `background_animation.css`, uses two pseudo-element layers:

- `body::before` — Colored dots (Google Blue, Green, Yellow, Red at low opacity) with slow 48s floating motion
- `body::after` — Star-like white dots with faster 18s drift

Both are `position: fixed`, `pointer-events: none`, `z-index: -1`, using `mix-blend-mode: screen`.

### Hover Effects

Standard hover pattern for all interactive elements:

```html
class="transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lg hover:ring-2 hover:ring-primary/40"
```

For cards with border glow:
```html
class="transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/10 hover:border-primary/30"
```

### Entrance Animations

Page-scoped keyframes (example from `index.astro`):

```css
@keyframes fade-in {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes slide-up {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fade-in {
  animation: fade-in 0.8s ease-out forwards;
}

.animate-slide-up {
  opacity: 0;
  animation: slide-up 0.6s ease-out forwards;
}
```

### Staggered Entry

Use CSS `animation-delay` via inline styles:

```astro
{items.map((item, index) => (
  <div
    class="animate-slide-up"
    style={`animation-delay: ${index * 100}ms`}
  >
    {/* content */}
  </div>
))}
```

### M3 Easing

Preferred easing for entrance animations:
```css
animation: fade-in-up 0.5s cubic-bezier(0.2, 0, 0.2, 1) both;
```

## Adding New Animations

1. Define `@keyframes` in page-scoped `<style>` blocks (for page-specific) or `global.css` (for shared).
2. Create utility classes that apply the animation.
3. Use `animation-delay` via inline styles for staggering.
4. Use `forwards` fill mode so elements stay in their final state.
5. Set initial opacity to 0 for entrance animations.

## Guardrails

- Never use JavaScript for animation timing or staggering.
- Never import Framer Motion, GSAP, Animate.css, or Lottie.
- Background shapes must use Google brand tones at opacity ≤ 0.18.
- All hover transitions must include `transition-all duration-300` minimum.
