---
name: astro-component-creation
description: Patterns for creating reusable Astro components following project conventions for typed props, styling, and slot composition.
triggers:
  - "create component"
  - "new component"
  - "astro component"
  - "reusable component"
  - "ui component"
---

# Astro Component Creation

## When to Use

When creating new reusable `.astro` components in `src/components/`.

## Component Template

```astro
---
interface Props {
  // Always define a typed Props interface
  title: string;
  variant?: 'primary' | 'surface';
  extraClass?: string;
}

const { title, variant = 'primary', extraClass = '' } = Astro.props;

// Compute classes
const variantStyles = {
  primary: 'bg-primary text-white',
  surface: 'bg-surface-container text-white/70 border border-white/10',
};

const classes = `${variantStyles[variant]} ${extraClass}`.trim();
---

<div class={`rounded-3xl p-6 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lg ${classes}`}>
  <h3 class="font-bold text-white text-xl mb-2">{title}</h3>
  <slot />
</div>
```

## Existing Component Inventory

| Component | Location | Purpose |
|---|---|---|
| `Head.astro` | `src/components/` | `<head>` with favicon, viewport, title |
| `PublicHeader.astro` | `src/components/` | Sticky nav bar with responsive icon/label toggle |
| `PublicFooter.astro` | `src/components/` | Footer with social links |
| `ActionButton.astro` | `src/components/` | Link-styled button (primary/surface/header variants) |
| `NavItem.astro` | `src/components/` | Navigation pill link with active state |
| `SocialIconButton.astro` | `src/components/` | Circular icon button for social links |
| `FormTextInputField.astro` | `src/components/` | Labeled text input with M3 styling |
| `AdminLayout.astro` | `src/components/admin/` | Admin page wrapper with header + sign-out |
| `AdminNavDock.astro` | `src/components/admin/` | Floating bottom nav dock with FAB + modal |
| `AdminTemplate.astro` | `src/components/admin/` | Currently empty — placeholder |

## Layout Hierarchy

```
BaseLayout.astro
├── Head.astro
├── PublicHeader.astro
│   ├── NavItem.astro (×7)
│   └── ActionButton.astro (download)
├── <slot /> (page content)
└── PublicFooter.astro
    └── SocialIconButton.astro (×4)

BackgroundBaseLayout.astro
├── Head.astro
└── <slot /> (standalone content like login or admin)
```

## Conventions

1. Always define `interface Props` — never use untyped props.
2. Use `<slot />` for composition, not prop drilling of children.
3. Import styles via `import '../styles/global.css'` only if the component is used outside a layout that already imports it.
4. Use Tailwind utility classes for styling — avoid inline `<style>` unless scoped animations are needed.
5. Icons come from `@lucide/astro` — import the specific icon component.
6. For conditional classes, use template literals with ternary expressions.
