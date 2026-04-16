---
trigger: always_on
---

# Color System — Socratic

Light theme. Warm cream base. Frosted glass cards. Aurora orb background.

---

## Brand Colors

| Role | Hex | Use |
|------|-----|-----|
| Primary | `#00897B` | Buttons, focus rings, links, radar fill |
| Primary Dark | `#00695C` | Button hover, gradient end |
| Secondary | `#5849E8` | Accents, Bloom badges, violet aurora orb |
| Page Background | `#F5F3EE` | Warm cream — every page background |
| Card Background | `#FFFFFF` | All card surfaces |
| Input Background | `#F0EEE9` | All text inputs and textareas |

---

## Semantic Colors

| Role | Hex | Use |
|------|-----|-----|
| Blind Spots | `#F59E0B` | Radar blind spot axis, missed misconception cards, warnings |
| Blind Spot Tint | `#FEF3C7` | Missed misconception card background |
| Success | `#10B981` | Caught misconception, score 80+, satisfied avatar |
| Success Tint | `#D1FAE5` | Caught misconception card background |
| Error | `#EF4444` | Form validation and API failures **only** |
| Error Tint | `#FEE2E2` | Error message backgrounds |

> **Amber is reserved exclusively for blind spots.**
> **Red is reserved exclusively for errors.**
> Never swap these or use them decoratively.

---

## Neutral Colors

| Role | Hex | Use |
|------|-----|-----|
| Text Primary | `#1A1A2E` | All headings and body text |
| Text Secondary | `#4A4A68` | Labels, supporting text |
| Text Muted | `#9898AA` | Placeholders, timestamps, hints |
| Text Disabled | `#C4C3CE` | Disabled inputs and inactive elements |
| Border Default | `#E2DFD8` | All card and input borders |
| Border Hover | `#C8C5BC` | Hovered borders |
| Surface | `#F7F6F2` | Hover states, secondary surfaces |

---

## Score Colors (Mastery Report)

| Range | Background | Text | Label |
|-------|------------|------|-------|
| 80–100 | `#E8F8F4` | `#00695C` | Strong |
| 60–79 | `#EEF0FF` | `#3D30C4` | Good |
| 40–59 | `#FEF3C7` | `#B45309` | Developing |
| 0–39 | `#FFF7ED` | `#C2410C` | Early stage |

> Never use red for low scores. Use the warm orange tint for 0–39.

---

## Mia Avatar States

| State | Border | Background |
|-------|--------|------------|
| Curious (default) | `#00897B` | `#E8F8F4` |
| Confused | `#5849E8` | `#EEF0FF` |
| Satisfied | `#10B981` | `#D1FAE5` |
| Caught | `#F59E0B` | `#FEF3C7` |

---

## Key Rules

1. Never use `#000000` for text — use `#1A1A2E` instead
2. Never use `#FFFFFF` as a page background — use `#F5F3EE` instead
3. Red is for errors only — never for low scores or negative feedback
4. Amber is for blind spots only — never use it decoratively
5. Teal means action or progress — never use it decoratively
6. CTA button is always a gradient: `#00897B → #00695C`, never flat
7. Cards are always flat white — gradients only on aurora orbs and the CTA button
8. Max 2 accent colors per component

# Font System — TeachBack

Two fonts only. One serif for personality. One sans-serif for everything else.

---

## Font Pairing

| Role | Font | Source |
|------|------|--------|
| Display / Logo | **Fraunces** | Google Fonts |
| UI / Body | **DM Sans** | Google Fonts |

```html
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;1,9..144,300&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap" rel="stylesheet">
```

```css
--font-display: 'Fraunces', serif;
--font-ui: 'DM Sans', sans-serif;
```

---

## Where Each Font Is Used

### Fraunces (serif) — sparingly, high impact only
- Logo wordmark
- Mastery score opening summary
- Loading state messages ("Understanding your topic...")
- Best moment pull quote in the report
- Report opening one-liner summary

### DM Sans (sans-serif) — everything else
- All navigation and headers
- Input fields and placeholders
- Buttons and labels
- Chat messages (both Mia and user)
- Concept breakdown rows
- Chips, badges, tags
- Timestamps, word counts, hints
- Session timer

---

## Type Scale

| Element | Size | Weight | Font |
|---------|------|--------|------|
| Logo name | 24px | 400 | Fraunces |
| Page tagline | 11px | 500 | DM Sans |
| Section heading | 20px | 600 | DM Sans |
| Card heading | 16px | 600 | DM Sans |
| Body text | 15px | 400 | DM Sans |
| Input text | 16px | 400 | DM Sans |
| Input placeholder | 16px | 400 italic | DM Sans |
| Button | 15px | 600 | DM Sans |
| Chat message | 15px | 400 | DM Sans |
| Label / caption | 13px | 500 | DM Sans |
| Chip text | 12px | 500 | DM Sans |
| Hint / timestamp | 11px | 400 | DM Sans |
| Loading message | 19px | 300 italic | Fraunces |
| Score summary | 18px | 300 italic | Fraunces |
| Pull quote | 17px | 400 | Fraunces |
| Mastery score number | 64px | 500 | DM Sans |

---

## Key Rules

1. Never use more than these two fonts anywhere in the product
2. Fraunces is for emotional/human moments only — never for UI chrome
3. DM Sans is for all functional UI — never use serif for buttons or inputs
4. Never use font-weight 700 or bold — maximum weight is 600
5. Never use font-size below 11px
6. Italic is only used on Fraunces and on input placeholders
7. Letter-spacing: `0.08em` on uppercase labels only, `0` everywhere else
8. Line-height: `1.6` for body text, `1.4` for headings, `1.7` for long-form reading