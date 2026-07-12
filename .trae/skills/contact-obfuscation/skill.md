---
name: contact-obfuscation
description: Zero-JS anti-spam techniques for hiding contact information from bots using CSS direction reversal and data attributes.
triggers:
  - "contact"
  - "email"
  - "obfuscation"
  - "anti-spam"
  - "hide email"
---

# Contact Link Obfuscation (Anti-Spam)

## Techniques

### CSS Direction Reversal

Render email backwards in HTML, reverse visually with CSS:

```html
<span class="obfuscated">ed.enilno.iduoas@tcatnoc</span>
```

```css
.obfuscated {
  unicode-bidi: bidi-override;
  direction: rtl;
}
```

Bots read the reversed text; humans see the correct email.

### Data Attribute + Pseudo-Element

```html
<a data-user="contact" data-domain="saoudi.online" class="email-link"></a>
```

```css
.email-link::after {
  content: attr(data-user) "@" attr(data-domain);
}
```

### Base64 Inline Decoder (Minimal JS)

Only allowed exception to zero-JS rule — single inline `atob()`:

```html
<a href="#" onclick="this.href='mailto:'+atob('Y29udGFjdEBzYW91ZGkub25saW5l')">
  Contact
</a>
```

## Current Implementation

The PublicFooter uses a direct `mailto:` link — this should be replaced with obfuscation in Phase 4.

## Guardrails

- No external JS libraries for obfuscation
- Prefer CSS-only methods over `atob()` when possible
- Store plain-text emails only in server-side code (Firestore `configuration/static_data`)
