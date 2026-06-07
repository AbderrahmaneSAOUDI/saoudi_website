---
name: anti-spam-obfuscation
description: Encodes communication handles as Base64 strings to eliminate scraping signatures from the rendered source HTML.
triggers:
  - "contact link"
  - "email button"
  - "telegram anchor"
  - "whatsapp href"
  - "scraper security"
---

# Anti-Spam Obfuscation

## System Context

All public contact links (email, Telegram, WhatsApp) must be protected from automated harvesting scripts. Contact data is stored as plain text in Firestore (`static_data.contact`) and is Base64-encoded at render time in Astro frontmatter. The encoded strings are decoded only upon explicit human activation via a minimal inline `atob()` call. This inline script is the **only** permitted client-side JavaScript on public pages.

**Architectural references:**

- Contact data: `configuration/static_data.contact`
- Source of truth: `README.md` → Contact Link Security (Anti-Spam)

---

## Playbook

### 1 — Static Encoding

Ensure that all user communication handles (Email, Telegram links, WhatsApp endpoints) are outputted in the static server-rendered HTML source markup strictly as Base64-encoded hashes.

In the Astro page frontmatter, Base64-encode all contact URIs:

```astro
---
import { db } from '../lib/firebase-admin';

const configDoc = await db.collection('configuration').doc('static_data').get();
const contact = configDoc.data()?.contact;

const encodedEmail = Buffer.from(`mailto:${contact.email}`).toString('base64');
const encodedTelegram = Buffer.from(`https://t.me/${contact.telegram}`).toString('base64');
const encodedWhatsapp = Buffer.from(`https://wa.me/${contact.whatsapp}`).toString('base64');
---
```

### 2 — Dynamic Resolution Runtime

Render inert anchor tags with no `href` attribute. Store the encoded payload in a `data-encoded` attribute:

```html
<a class="contact-link" data-encoded={encodedEmail} role="button" tabindex="0">
  Email Me
</a>

<a class="contact-link" data-encoded={encodedTelegram} role="button" tabindex="0">
  Telegram
</a>

<a class="contact-link" data-encoded={encodedWhatsapp} role="button" tabindex="0">
  WhatsApp
</a>
```

Pair the encoded markup elements with a clean, inline vanilla JS event listener that executes `atob()` to dynamically reconstruct and attach a functional target hyperlink context:

```html
<script>
  document.querySelectorAll('.contact-link').forEach(function(el) {
    el.addEventListener('click', function() {
      window.location.href = atob(this.dataset.encoded);
    });
  });
</script>
```

This inline script must:

- Use vanilla JS only (no imports, no modules).
- Activate only on explicit user interaction (`click`).
- Contain no analytics, tracking, or side-effects.

---

## Hard Guardrails

- **BANNED:** Rendering plain-text contact URLs anywhere in the HTML source.
- **BANNED:** Using `href="mailto:..."` or `href="https://t.me/..."` directly in templates.
- **BANNED:** Decoding contact data on page load — must be triggered by explicit user action only.
- **BANNED:** External libraries for obfuscation (no `react-obfuscate`, no email encoding libs).
- **BANNED:** More than one `<script>` block for contact decoding per page.
- **REQUIRED:** All contact URIs must be Base64-encoded server-side in Astro frontmatter.
- **REQUIRED:** Encoded data stored in `data-encoded` attributes, never in `href`.
- **REQUIRED:** The inline decoder script must be under 5 lines of vanilla JS logic.
- **REQUIRED:** Anchor elements must include `role="button"` and `tabindex="0"` for accessibility.
