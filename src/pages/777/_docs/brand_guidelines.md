# Brand Identity & Visual Design Guidelines

## Platform: `777.mpt.gov.dz`

---

### 1. Color Palette & Token System

#### Primary Colors

* **Governmental Deep Navy (`#0B2545`)**

* **RGB:** `rgb(11, 37, 69)`

* **Role:** Primary brand anchor, dominant navigation bars, dark-mode cards, primary text on light backgrounds.




* **Telecom Cyan-Blue (`#0066CC`)**

* **RGB:** `rgb(0, 102, 204)`

* **Role:** Interactive links, primary action triggers, brand accents, icon fills.




* **Innovation Turquoise / Teal (`#00A896`)**

* **RGB:** `rgb(0, 168, 150)`

* **Role:** Secondary buttons, progress indicators, feature highlights, badge backgrounds.





#### Accent Colors

* **Energy Orange / Amber (`#F26419`)**

* **RGB:** `rgb(242, 100, 25)`

* **Role:** Primary Call-to-Action (CTA) buttons, notification badges, active step indicators.




* **Algerian Emerald Green (`#008A00`)**

* **RGB:** `rgb(0, 138, 0)`

* **Role:** Success states, verified badges, certification marks.





#### Neutral & Background Palette

* **Deep Charcoal / Text Base (`#0F172A`):** Headlines and primary typography.


* **Subtle Slate / Border (`#E2E8F0`):** Card borders, input field outlines, and dividers.
* **Light Tech Canvas (`#F8FAFC`):** Primary page background.


* **Pure White (`#FFFFFF`):** Elevated container backgrounds, modals, input surfaces.



---

### 2. Typography & Script Hierarchy

#### Font Families

* **Primary Arabic Script (RTL):** `Cairo` or `Tajawal` (Fallback: `IBM Plex Sans Arabic`, `sans-serif`).


* **Primary Latin Script (LTR - French/English):** `Inter` or `Montserrat` (Fallback: `system-ui`, `sans-serif`).



#### Type Hierarchy & Scales

| Level | Font Size | Line Height | Font Weight | Usage Context |
| --- | --- | --- | --- | --- |
| **Display (Hero)** | `36px – 44px`<br> | `1.2` | Bold (700) / ExtraBold (800)

 | Hero titles and landing key phrases

 |
| **Heading 1 (H1)** | `28px – 32px` | `1.3` | Bold (700)

 | Major section headers |
| **Heading 2 (H2)** | `22px – 24px`<br> | `1.35` | SemiBold (600) / Bold (700)

 | Module headers and section dividers |
| **Heading 3 (H3)** | `16px – 18px`<br> | `1.4` | SemiBold (600)

 | Card titles, modal titles

 |
| **Body (Base)** | `15px – 16px` | `1.6`<br> | Regular (400)

 | Standard paragraph text, form descriptions |
| **Small / Caption** | `12px – 13px` | `1.5` | Medium (500)

 | Meta tags, timestamps, helper text |
| **Overline / Badge** | `11px – 12px` | `1.0` | SemiBold (600) / Uppercase

 | Category tags, status pills

 |

---

### 3. Geometry, Shapes & Corner Radii

* **The "7" Dynamic Diagonal Motif:**
* Uses acute 45° and 60° angular slants across background vector accents, section dividers, and hero banners.
* Structural lines reflect the sharp diagonal geometry of the numeral "7".


* **Border Radii System:**
* **Micro (`4px`):** Checkboxes, tags, input badges.
* **Default / Components (`8px – 10px`):** Form inputs, buttons, secondary cards.
* **Containers (`16px – 20px`):** Main feature cards, modal dialogs, course blocks.
* **Full Rounded (`9999px` / Pill):** Filter chips, status badges, primary floating action buttons.



---

### 4. Elevation, Depth & Shadow System

```css
/* Elevation Tokens */
--shadow-sm: 0 1px 2px 0 rgba(11, 37, 69, 0.05);
--shadow-md: 0 4px 6px -1px rgba(11, 37, 69, 0.08), 0 2px 4px -2px rgba(11, 37, 69, 0.04);
--shadow-lg: 0 10px 15px -3px rgba(11, 37, 69, 0.10), 0 4px 6px -4px rgba(11, 37, 69, 0.05);
--shadow-glow: 0 0 16px rgba(0, 102, 204, 0.25);
```

* **Surface Treatment:** Clean solid fills with a `1px` subtle border (`#E2E8F0`).
* **Glassmorphism (Restricted Usage):** `backdrop-filter: blur(12px)` with `background: rgba(255, 255, 255, 0.85)` used strictly for sticky top headers and floating navigation panels.

---

### 5. Iconography & Graphical Elements

* **Icon Style:** Line/Duotone geometry with uniform `2px` stroke weight.
* **Corner Style:** Rounded joints (`stroke-linejoin: round; stroke-linecap: round`).
* **Sizing Grid:**
* Inline Icon: `16px × 16px`
* Action / Nav Icon: `24px × 24px`
* Feature Card Hero Icon: `48px × 48px` (encapsulated inside a `64px × 64px` rounded-square container with `10%` accent background tint).



---

### 6. Layout Grid & Spacing System

* **Base Spacing Unit:** 8-point spatial grid (`4px`, `8px`, `16px`, `24px`, `32px`, `48px`, `64px`, `96px`).
* **Container Max-Width:** `1280px` (Desktop standard), `1440px` (Large display).
* **Grid Columns:**
* **Desktop:** 12-column grid with `24px` gutters and `32px` page margins.
* **Tablet:** 8-column grid with `16px` gutters.
* **Mobile:** 4-column grid with `12px` gutters and `16px` outer margins.


* **Bidirectional Layout (LTR / RTL):** Full mirror architecture ensuring all margins, paddings, flex directions, and chevron orientations flip dynamically between Arabic (RTL) and Latin (LTR) interfaces.

---

### 7. Logo Rules & Clear Space

```
        ┌──────────────────────────────────────────────────┐
        │                 CLEAR SPACE: [X]                 │
        │                                                  │
        │   [X]     ┌────────────────────────┐     [X]     │
        │           │    7.77 Master Logo    │             │
        │   [X]     └────────────────────────┘     [X]     │
        │                                                  │
        │                 CLEAR SPACE: [X]                 │
        └──────────────────────────────────────────────────┘
```

* **Clear Space ($X$):** Equal to the height of the numeral "7" in the primary mark.
* **Minimum Size Requirements:**
* **Digital:** Minimum height of `32px` (standard screens) or `64px` (retina displays).
* **Print:** Minimum height of `15mm`.


* **Prohibited Modifications:**
* Do not stretch, skew, or alter the proportional aspect ratio.
* Do not apply unauthorized drop shadows or outer neon glows to the logo mark.
* Do not place the primary colored logo over low-contrast or cluttered backgrounds (use solid white monochrome version on dark backgrounds).
