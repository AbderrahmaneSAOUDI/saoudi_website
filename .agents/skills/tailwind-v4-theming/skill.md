---
name: tailwind-v4-theming
description: Tailwind CSS v4 theme token system with @theme blocks, custom screen breakpoints, and responsive utility patterns.
triggers:
  - "tailwind"
  - "css tokens"
  - "theme"
  - "colors"
  - "responsive"
  - "breakpoint"
---

# Tailwind CSS v4 Theming

## Token System

Tokens are defined in `src/styles/global.css` using Tailwind v4 `@theme {}`:

```css
@theme {
  --color-google-blue: #4285F4;
  --color-google-red: #EA4335;
  --color-google-yellow: #F9AB00;
  --color-google-green: #34A853;

  --color-primary: var(--color-google-blue);
  --color-secondary: var(--color-google-green);
  --color-tertiary: var(--color-google-yellow);
  --color-error: var(--color-google-red);

  --color-surface: #121212;
  --color-surface-container: #1E1E1E;
  --color-surface-container-high: #2D2D2D;
}
```

Usage: `bg-primary`, `text-google-blue`, `bg-surface-container`, etc.

## Custom Breakpoints

Defined in `tailwind.config.mjs`:

| Breakpoint | Width |
|---|---|
| `sm` | 640px |
| `md` | 1000px (custom - not default 768px!) |
| `lg` | 1280px |
| `xl` | 1440px |
| `2xl` | 1536px |

**Important:** `md` is 1000px, not the Tailwind default 768px. This aligns with the header responsive behavior.

## Responsive Header Behavior

Custom utility classes in `global.css` handle header responsiveness at 1000px:

```css
@layer utilities {
  .header-logo { display: none !important; }
  .nav-icon { display: inline-flex !important; }
  .nav-label { display: none !important; }

  @media (min-width: 1000px) {
    .header-logo { display: flex !important; }
    .nav-icon { display: none !important; }
    .nav-label { display: inline !important; }
  }
}
```

## Random Primary Color

`BaseLayout.astro` sets a random primary color per page load:

```astro
const primaryColor = getRandomColor(); // from src/lib/colors.ts
<html style={`--color-primary: ${primaryColor}`}>
```

This overrides `--color-primary` with a random Google brand shade.

## Adding New Tokens

Add to the `@theme {}` block in `global.css`:
```css
@theme {
  --color-new-token: #hexvalue;
}
```

Then use as `bg-new-token`, `text-new-token`, etc.
