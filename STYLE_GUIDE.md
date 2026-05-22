# Design & Style Guide

> Derived from: **squirrel-notes**, **garethhughes.dev**, **fragile**
>
> Use this guide to maintain a consistent look and feel across all new software projects.

---

## Table of Contents

1. [Tech Stack & Tooling](#tech-stack--tooling)
2. [Color System](#color-system)
3. [Typography](#typography)
4. [Spacing & Sizing](#spacing--sizing)
5. [Border Radius](#border-radius)
6. [Shadows](#shadows)
7. [Layout Patterns](#layout-patterns)
8. [Component Patterns](#component-patterns)
9. [Animation & Transitions](#animation--transitions)
10. [Icons](#icons)
11. [Dark Mode](#dark-mode)
12. [Accessibility & WCAG Compliance](#accessibility--wcag-compliance)
13. [Starter globals.css](#starter-globalscss)

---

## Tech Stack & Tooling

All three projects share a consistent technical foundation:

| Concern | Choice |
|---------|--------|
| Framework | **Next.js** (App Router, latest) |
| Language | **TypeScript** (`strict: true`) |
| Styling | **Tailwind CSS v4** (CSS-first config via `@theme inline`, no JS config file) |
| Fonts | **Geist** (sans) + **Geist Mono** (mono) via `next/font/google` |
| Icons | **lucide-react** |
| State | **Zustand** (when client state is needed) |
| Markdown | react-markdown + remark-gfm + rehype-highlight |
| UI Library | **None** -- all components are custom-built with Tailwind utilities |
| PostCSS | `@tailwindcss/postcss` plugin only |

### Project Init Checklist

```bash
# Dependencies
next react react-dom
typescript @types/react @types/node
tailwindcss @tailwindcss/postcss
lucide-react

# postcss.config.mjs
export default { plugins: { '@tailwindcss/postcss': {} } }
```

---

## Color System

### Architecture

The color system uses a **two-layer token approach**:

1. **Primitive scale** -- A brand color ramp ("squirrel") available as utility classes
2. **Semantic tokens** -- CSS custom properties mapping intent to concrete values

All colors are defined in `globals.css` via the `@theme inline` directive. Components reference semantic tokens (`bg-surface`, `text-text-primary`) rather than raw hex values.

### Brand Scale ("Squirrel" -- Blue)

| Token | Hex | Swatch |
|-------|-----|--------|
| `squirrel-50` | `#eff6ff` | Lightest tint, brand backgrounds |
| `squirrel-100` | `#dbeafe` | Active/selected states |
| `squirrel-200` | `#bfdbfe` | Light accents |
| `squirrel-300` | `#93c5fd` | Decorative borders |
| `squirrel-400` | `#60a5fa` | Focus rings, secondary accents |
| `squirrel-500` | `#3b82f6` | **Primary action color** |
| `squirrel-600` | `#2563eb` | Primary hover state |
| `squirrel-700` | `#1d4ed8` | Dark accent, links |
| `squirrel-800` | `#1e40af` | Dark headings (prose) |
| `squirrel-900` | `#1e3a8a` | Darkest brand |

### Semantic Surface Tokens

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--background` | `#ffffff` | `#282c34` | Page background |
| `--foreground` | `#1e293b` | `#abb2bf` | Default text |
| `--surface` | `#ffffff` | `#282c34` | Card/panel background |
| `--surface-alt` | `#f8fafc` | `#21252b` | Alternate/recessed surface |
| `--surface-brand` | `#eff6ff` | `#2c313a` | Brand-tinted areas (sidebars) |
| `--surface-hover` | `#f1f5f9` | `#2c313a` | Hover state background |
| `--surface-raised` | `#e2e8f0` | `#3e4451` | Elevated surfaces, scrollbar thumbs |
| `--surface-active` | `#dbeafe` | `#3e4451` | Selected/active items |

### Semantic Border Tokens

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--border-color` | `#e2e8f0` | `#3e4451` | Default border |
| `--border-light` | `#f1f5f9` | `#2c313a` | Subtle dividers |

### Semantic Text Tokens

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--text-primary` | `#1e293b` | `#abb2bf` | Headings, important text |
| `--text-secondary` | `#334155` | `#9da5b4` | Body text |
| `--text-tertiary` | `#475569` | `#7f8799` | Supporting text |
| `--text-muted` | `#64748b` | `#636d83` | Labels, section headers |
| `--text-faint` | `#94a3b8` | `#5c6370` | Placeholders, timestamps |

### Primary Action Tokens

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--primary` | `#3b82f6` | `#528bff` | Primary buttons, links |
| `--primary-hover` | `#2563eb` | `#4070e0` | Primary hover state |
| `--primary-fg` | `#ffffff` | `#ffffff` | Text on primary background |

### Interactive State Tokens

| Token | Light | Dark |
|-------|-------|------|
| `--interactive-selected-bg` | `#dbeafe` | `#3e4451` |
| `--interactive-selected-fg` | `#1d4ed8` | `#61afef` |
| `--interactive-selected-border` | `#60a5fa` | `#528bff` |
| `--interactive-hover-bg` | `#f1f5f9` | `#2c313a` |

### Utility / Status Colors

Use Tailwind's built-in palette for semantic states:

| State | Text | Background | Border |
|-------|------|------------|--------|
| Success | `text-green-600` | `bg-green-50` | `border-green-200` |
| Info | `text-blue-600` | `bg-blue-50` | `border-blue-200` |
| Warning | `text-amber-600` | `bg-amber-50` | `border-amber-200` |
| Error/Danger | `text-red-600` | `bg-red-50` | `border-red-200` |

### Data Visualization Palette

For charts, use this deterministic 8-color sequence:

```
#3b82f6  (blue-500)     -- primary metric
#8b5cf6  (violet-500)   -- secondary metric
#ef4444  (red-500)      -- negative/failure
#f59e0b  (amber-500)    -- warning/caution
#22c55e  (green-500)    -- positive/success
#06b6d4  (cyan-500)     -- supplementary
#ec4899  (pink-500)     -- supplementary
#84cc16  (lime-500)     -- supplementary
```

### Token Contrast Rules

Tokens are defined generically. Not every token pair produces adequate visual contrast when combined. **Always evaluate the actual hex values against the specific background a component sits on.**

#### Known Low-Contrast Pairings (avoid these combinations)

| Foreground/Hover | Background | Problem |
|-----------------|------------|---------|
| `surface-hover` (`#f1f5f9`) | `surface-brand` (`#eff6ff`) | Nearly invisible -- both are pale near-whites |
| `surface-hover` (`#f1f5f9`) | `surface-alt` (`#f8fafc`) | Minimal distinction |
| `border-light` (`#f1f5f9`) | `surface` (`#ffffff`) | Very subtle, may not register |
| `text-faint` (`#94a3b8`) | `surface-brand` (`#eff6ff`) | Marginal for small text |

#### Minimum Contrast Step Rule

When a hover/active state needs to be **perceptible**, use a token that is at least **2 steps** on the scale from the resting background:

| Resting Background | Minimum Hover/Active | Reasoning |
|-------------------|---------------------|-----------|
| `surface` (`#ffffff`) | `surface-hover` (`#f1f5f9`) | 1 step is enough on pure white |
| `surface-alt` (`#f8fafc`) | `surface-raised` (`#e2e8f0`) | Skip `surface-hover`, it's too close |
| `surface-brand` (`#eff6ff`) | `surface-raised` (`#e2e8f0`) | Skip `surface-hover`, it's too close |
| `surface-hover` (`#f1f5f9`) | `surface-raised` (`#e2e8f0`) | Next visible step |

#### Application Rules

1. **Evaluate token pairs, not tokens in isolation.** Before assigning a hover/text token, determine the parent background and verify the contrast between the resolved hex values.
2. **Never batch-replace color tokens globally.** Color is contextual -- the same token may work on one surface and fail on another. Apply per-component with awareness of nesting.
3. **Flag ambiguous pairings.** If a background and foreground/hover token are within ~20-30 HSL lightness points of each other, present the specific values for review rather than silently applying them.
4. **When in doubt, step darker.** If you're unsure whether a hover state will be visible, use the next-darker surface token. It's better to be slightly heavy-handed than invisible.

---

## Typography

### Font Families

| Role | Family | Variable | Fallback |
|------|--------|----------|----------|
| UI / Body | **Geist** | `--font-geist-sans` | Arial, Helvetica, sans-serif |
| Code / Mono | **Geist Mono** | `--font-geist-mono` | monospace |

```tsx
// app/layout.tsx
import { Geist, Geist_Mono } from 'next/font/google';

const geistSans = Geist({ subsets: ['latin'], variable: '--font-geist-sans' });
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono' });
```

### Type Scale

| Class | Size | Usage |
|-------|------|-------|
| `text-[10px]` | 10px | Micro badges, fine print |
| `text-xs` | 12px | Tags, metadata, timestamps |
| `text-sm` | 14px | Body text, form inputs, buttons, nav links |
| `text-base` | 16px | Section headings, app name |
| `text-lg` | 18px | Sub-headings, brand name |
| `text-xl` | 20px | Card titles, feature headings |
| `text-2xl` | 24px | Page titles |
| `text-3xl` | 30px | Hero headings, large metrics |

### Font Weights

| Class | Value | Usage |
|-------|-------|-------|
| (default) | 400 | Body text |
| `font-medium` | 500 | Buttons, labels, nav items, badges |
| `font-semibold` | 600 | Card titles, section headers, H2/H3 |
| `font-bold` | 700 | Page titles, H1, brand, hero metrics |

### Line Heights

| Class | Value | Usage |
|-------|-------|-------|
| `leading-tight` | 1.25 | Page headings |
| `leading-snug` | 1.375 | Card titles |
| `leading-relaxed` | 1.625 | Descriptions, excerpts |
| (prose) | 1.7 | Long-form paragraph text |
| (prose lists) | 1.6 | List items |

### Letter Spacing

| Class | Usage |
|-------|-------|
| `tracking-tight` | Large metric values, brand name |
| `tracking-wider` | Uppercase section labels (e.g., sidebar headers) |

---

## Spacing & Sizing

### Spacing Scale (commonly used values)

| Value | Pixels | Common Usage |
|-------|--------|--------------|
| `gap-1` / `p-1` | 4px | Tight inline grouping |
| `gap-1.5` | 6px | Icon + text pairs |
| `gap-2` / `p-2` | 8px | Button groups, small padding |
| `gap-3` / `p-3` | 12px | Nav items, standard button padding |
| `gap-4` / `p-4` | 16px | Card padding, grid gaps |
| `p-5` | 20px | Larger card padding |
| `p-6` / `gap-6` | 24px | Page content padding, section spacing |
| `p-8` | 32px | Hero sections, large cards |
| `space-y-6` | 24px | Between page sections |
| `mb-8` | 32px | Major section breaks |
| `mt-16` | 64px | Footer separation |

### Consistent Sizing

| Element | Value |
|---------|-------|
| Header height | `h-14` (56px) |
| Sidebar width | `w-60` (240px) or `w-72` (288px) |
| Content max-width | `max-w-4xl` (896px) for content sites |
| Standard icon | `h-5 w-5` (20px) |
| Small icon | `h-4 w-4` (16px) |
| Large icon | `h-7 w-7` (28px) or `h-12 w-12` (48px) |
| Indicator dots | `h-2 w-2` (8px) |

---

## Border Radius

| Class | Pixels | Usage |
|-------|--------|-------|
| `rounded` | 4px | Small interactive elements, scrollbar thumb |
| `rounded-md` | 6px | Buttons, dropdowns, list items, inputs |
| `rounded-lg` | 8px | Cards (compact), chips, nav items, search bars |
| `rounded-xl` | 12px | Cards (standard), modals, panels, tables |
| `rounded-2xl` | 16px | Large modals |
| `rounded-full` | 9999px | Badges, pills, tags, avatars, progress bars |

### Default by component type:
- **Cards/Panels:** `rounded-xl`
- **Buttons/Inputs:** `rounded-md` or `rounded-lg`
- **Badges/Pills:** `rounded-full`
- **Modals:** `rounded-xl` or `rounded-2xl`
- **Tables (wrapper):** `rounded-xl`

---

## Shadows

| Class | Usage |
|-------|-------|
| `shadow-sm` | Cards at rest, metric cards |
| `shadow-md` | Cards on hover, floating menus |
| `shadow-lg` | Dropdowns, popovers, mobile overlays |
| `shadow-xl` | Modals, mobile sidebar overlay |
| `shadow-2xl` | Large modals |

### Shadow Progression Pattern
Cards: `shadow-sm` at rest -> `shadow-md` on hover (with `transition-shadow`).

---

## Layout Patterns

### App Shell (Dashboard/App)

```
flex h-screen overflow-hidden
  +-- Sidebar (w-60, border-r, bg-surface-brand)
  +-- Main (flex-1, flex-col, overflow-hidden)
       +-- Header (h-14, sticky, border-b) [optional]
       +-- Content (flex-1, overflow-y-auto, p-6)
```

### Content Site Layout

```
min-h-screen bg-background
  +-- Header (sticky top-0 z-40, h-14, border-b)
  +-- Main (mx-auto max-w-4xl px-4 py-10 md:px-6)
  +-- Footer (mt-16, border-t, bg-surface-alt)
```

### Grid Patterns

```css
/* Metric cards (4-up) */
grid gap-4 sm:grid-cols-2 lg:grid-cols-4

/* Two-column content */
grid grid-cols-1 gap-4 lg:grid-cols-2

/* Project/feature grid */
grid gap-6

/* List layout */
flex flex-col gap-4
```

### Responsive Strategy

- **Mobile breakpoint:** `md:` (768px)
- **Mobile:** Sidebar overlays as drawer, hamburger menu in header
- **Desktop:** Sidebar inline, split-pane where applicable
- Mobile sidebar: `max-w-[80vw]` with `shadow-xl` overlay

---

## Component Patterns

### Card

```tsx
<div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
  {/* content */}
</div>
```

Hover variant (links/clickable):
```tsx
<div className="rounded-xl border border-border bg-surface p-5 shadow-sm
                transition-shadow hover:shadow-md">
```

With status indicator (left border):
```tsx
<div className="rounded-xl border border-border border-l-4 border-l-green-400
                bg-surface p-4 shadow-sm">
```

### Button Variants

```tsx
/* Primary */
<button className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium
                   text-primary-fg transition-colors hover:bg-primary-hover">

/* Secondary / Ghost */
<button className="rounded-md px-3 py-1.5 text-sm font-medium text-text-tertiary
                   transition-colors hover:bg-surface-hover">

/* Danger */
<button className="rounded-md bg-red-500 px-3 py-1.5 text-sm font-medium
                   text-white transition-colors hover:bg-red-600">

/* Outline */
<button className="rounded-md border border-border px-3 py-1.5 text-sm
                   font-medium text-text-secondary transition-colors
                   hover:bg-surface-hover">
```

### Badge / Pill

```tsx
<span className="rounded-full border border-green-200 bg-green-50 px-2.5
                 py-0.5 text-xs font-semibold text-green-600">
  Label
</span>
```

### Chip / Toggle

```tsx
/* Default */
<button className="rounded-lg border border-border px-3 py-1.5 text-sm
                   font-medium text-text-secondary transition-colors
                   hover:bg-surface-hover">

/* Selected */
<button className="rounded-lg border border-interactive-selected-border
                   bg-interactive-selected-bg px-3 py-1.5 text-sm font-medium
                   text-interactive-selected-fg">
```

### Input / Search

```tsx
<input className="w-full rounded-lg border border-border bg-transparent px-3
                  py-2 text-sm text-text-primary outline-none
                  placeholder:text-text-faint
                  focus:border-squirrel-400 focus:ring-1 focus:ring-squirrel-400" />
```

### Modal / Dialog

```tsx
/* Overlay */
<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
  {/* Card */}
  <div className="max-w-[90vw] rounded-xl bg-surface p-4 shadow-xl">
    {/* content */}
  </div>
</div>
```

### Table

```tsx
<div className="overflow-x-auto rounded-xl border border-border">
  <table className="w-full text-sm">
    <thead className="bg-surface-alt text-text-muted">
      <tr>
        <th className="px-4 py-3 text-left font-semibold">Header</th>
      </tr>
    </thead>
    <tbody className="divide-y divide-border">
      <tr className="hover:bg-surface-hover transition-colors">
        <td className="px-4 py-3">Cell</td>
      </tr>
    </tbody>
  </table>
</div>
```

### Empty State

```tsx
<div className="flex flex-col items-center justify-center px-6 py-16 text-center">
  <Icon className="mb-4 h-12 w-12 text-text-faint" />
  <h3 className="text-lg font-semibold text-text-primary">No items</h3>
  <p className="mt-1 text-sm text-text-muted">Description text here</p>
</div>
```

### Sidebar Navigation Item

```tsx
/* Default */
<a className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm
              font-medium text-text-secondary transition-colors
              hover:bg-surface-hover">
  <Icon className="h-5 w-5" />
  Label
</a>

/* Active */
<a className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm
              font-medium bg-interactive-selected-bg
              text-interactive-selected-fg">
  <Icon className="h-5 w-5" />
  Label
</a>
```

---

## Animation & Transitions

### Standard Transitions

| Pattern | Usage |
|---------|-------|
| `transition-colors` | All interactive elements (buttons, links, nav items) |
| `transition-shadow` | Cards with hover shadow change |
| `transition-opacity` | Fade in/out elements |
| `transition-transform duration-300` | Scale transforms (image hover) |
| `transition-all duration-200` | Complex state changes (FAB) |

### Animations

```css
/* Dropdown entry */
@keyframes dropdown-in {
  from { opacity: 0; transform: translateY(-6px); }
  to   { opacity: 1; transform: translateY(0); }
}
.dropdown-enter { animation: dropdown-in 0.16s ease-out both; }

/* Backdrop fade */
@keyframes backdrop-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}
.backdrop-enter { animation: backdrop-in 0.15s ease-out both; }

/* Speed-dial / FAB items */
@keyframes fab-item-in {
  from { opacity: 0; transform: translateY(10px) scale(0.92); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
.fab-item-enter { animation: fab-item-in 0.18s cubic-bezier(0.34, 1.56, 0.64, 1) both; }
```

### Loading States

- Skeleton: `animate-pulse` with `rounded bg-surface-raised`
- Spinner: `animate-spin` on a Loader2 icon or custom border spinner:
  ```tsx
  <div className="h-5 w-5 animate-spin rounded-full border-2
                  border-squirrel-400 border-t-transparent" />
  ```

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  .fab-item-enter, .dropdown-enter, .backdrop-enter { animation: none; }
}
```

---

## Icons

- **Library:** `lucide-react` (tree-shakeable, consistent 24px viewBox)
- **Sizing convention:**
  - Inline with text: `size={12}` or `size={14}`
  - Standard UI: `size={16}` or `className="h-5 w-5"`
  - Navigation: `className="h-5 w-5"`
  - Branding / hero: `className="h-7 w-7"` or larger
  - Empty states: `className="h-12 w-12"`
- **Color:** Icons inherit text color via `currentColor` (use text utility classes)

---

## Dark Mode

### Default: Light

The default theme is **light**. Dark mode is opt-in, toggled by the user. New projects should ship in light mode with dark mode available as a preference.

### Strategy

- **Default:** Light (no class on `<html>`)
- **Opt-in dark:** Class-based, `.dark` on `<html>` element
- Tailwind variant: `@variant dark (&:where(.dark, .dark *));`
- Persistence: `localStorage` (respect user preference, do not default to dark)
- Dark palette: **One Monokai** inspired

### Implementation

```css
/* In globals.css */
@variant dark (&:where(.dark, .dark *));

:root {
  --background: #ffffff;
  /* ... light tokens ... */
}

.dark {
  --background: #282c34;
  /* ... dark tokens ... */
}
```

Components use semantic tokens (`bg-surface`, `text-text-primary`) so they automatically adapt to the active theme without conditional classes.

---

## Accessibility & WCAG Compliance

### Target: WCAG 2.1 AA

All new projects must meet **WCAG 2.1 Level AA** as a minimum. Key requirements:

### Text Contrast (WCAG 1.4.3 / 1.4.6)

| Requirement | Minimum Ratio | Applies To |
|-------------|---------------|------------|
| **Normal text** (< 18px, or < 14px bold) | **4.5:1** | Body copy, labels, descriptions, nav links |
| **Large text** (>= 18px, or >= 14px bold) | **3:1** | Headings, hero text, large metrics |
| **Enhanced (AAA)** | **7:1** | Target for primary body text where possible |

#### Token Contrast Verification (Light Theme)

| Token | Hex | On `#ffffff` | On `#eff6ff` | On `#f8fafc` |
|-------|-----|-------------|-------------|-------------|
| `text-primary` | `#1e293b` | 12.6:1 | 11.4:1 | 12.0:1 |
| `text-secondary` | `#334155` | 9.2:1 | 8.4:1 | 8.8:1 |
| `text-tertiary` | `#475569` | 6.4:1 | 5.8:1 | 6.1:1 |
| `text-muted` | `#64748b` | 4.5:1 | 4.1:1 | 4.3:1 |
| `text-faint` | `#94a3b8` | 2.7:1 | 2.5:1 | 2.6:1 |

**Rules:**
- `text-faint` **fails** AA for text at any size. Use only for decorative/supplementary content that is not essential (e.g., watermarks, disabled placeholders). Never use for actionable labels.
- `text-muted` passes AA for normal text on `surface` (`#ffffff`) but **fails on `surface-brand`** (`#eff6ff`). On tinted backgrounds, use `text-tertiary` or darker.
- When placing text on `surface-brand` or `surface-alt`, default to `text-tertiary` (`#475569`) as the lightest acceptable body text color.

### Non-Text Contrast (WCAG 1.4.11)

UI components and graphical objects that convey meaning must have at least **3:1** contrast against adjacent colors.

This applies to:
- Icon-only buttons
- Form input borders
- Focus indicators
- Chart elements (bars, lines, points)
- Custom checkboxes/toggles
- Active/inactive state indicators

#### Icon Contrast Rules

| Context | Minimum Color | Avoid |
|---------|--------------|-------|
| Icon on `surface` (`#fff`) | `text-muted` (`#64748b`) -- 4.5:1 | `text-faint` (2.7:1, fails) |
| Icon on `surface-brand` (`#eff6ff`) | `text-tertiary` (`#475569`) -- 5.8:1 | `text-muted` (4.1:1, marginal) |
| Icon on `surface-alt` (`#f8fafc`) | `text-muted` (`#64748b`) -- 4.3:1 | `text-faint` (2.6:1, fails) |
| Icon on dark `surface` (`#282c34`) | `text-secondary` (`#9da5b4`) -- 4.8:1 | `text-muted` (2.8:1, fails) |

**Rules for icons:**
- Standalone icons (no visible text label) that serve as interactive controls must meet **4.5:1** (treat as equivalent to text).
- Decorative icons adjacent to a text label can be lighter (3:1 minimum) since the label carries the meaning.
- Never rely solely on `text-faint` icons for interactive affordances.

### Hover & Interactive State Contrast

Hover/focus/active states must produce a **visible change** that meets non-text contrast requirements.

#### Hover Background Minimum Contrast (3:1 vs resting state)

| Resting Background | Hover Background | Contrast | Verdict |
|-------------------|-----------------|----------|---------|
| `surface` (`#ffffff`) | `surface-hover` (`#f1f5f9`) | 1.06:1 | Fails alone -- pair with text/border color change |
| `surface-brand` (`#eff6ff`) | `surface-hover` (`#f1f5f9`) | 1.02:1 | **Fails** -- use `surface-raised` or add border |
| `surface-brand` (`#eff6ff`) | `surface-raised` (`#e2e8f0`) | 1.15:1 | Still low -- combine with border or text shift |
| `surface` (`#ffffff`) | `surface-active` (`#dbeafe`) | 1.13:1 | Low -- acceptable only with additional indicator |

**Key insight:** Background-only hover states on pale surfaces rarely meet 3:1 in isolation. Combine multiple signals:

```tsx
/* Good: hover uses background + border + text color shift */
<button className="rounded-md border border-transparent bg-surface-brand
                   text-text-tertiary transition-colors
                   hover:border-squirrel-300 hover:bg-surface-raised
                   hover:text-text-primary">

/* Good: hover uses underline + color shift (no background needed) */
<a className="text-text-secondary transition-colors
              hover:text-primary hover:underline">

/* Bad: background-only hover on tinted surface */
<button className="bg-surface-brand hover:bg-surface-hover">
  {/* Invisible change */}
</button>
```

#### Acceptable Hover Patterns (ranked by strength)

1. **Color shift + border** -- strongest signal, works on any surface
2. **Underline + color shift** -- good for inline links and text buttons
3. **Shadow elevation** -- `shadow-sm` -> `shadow-md` provides depth cue
4. **Background darkening by 2+ steps** -- e.g., `surface` -> `surface-raised`
5. **Scale transform** -- `hover:scale-105` for image/card hover (supplement, not sole indicator)

Never rely on background shift alone when the resting and hover backgrounds are both in the 95-100% lightness range.

### Focus Indicators (WCAG 2.4.7 / 2.4.11)

Focus must be **clearly visible** with at least 3:1 contrast against adjacent colors.

```tsx
/* Standard focus ring */
className="focus:border-squirrel-400 focus:ring-1 focus:ring-squirrel-400
           focus:outline-none"

/* Focus-visible (keyboard only, no mouse) */
className="focus-visible:ring-2 focus-visible:ring-squirrel-500
           focus-visible:ring-offset-2 focus-visible:outline-none"
```

- `squirrel-400` (`#60a5fa`) on `surface` (`#ffffff`) = 2.9:1 -- borderline. Use `ring-2` (2px) to compensate with area.
- `squirrel-500` (`#3b82f6`) on `surface` (`#ffffff`) = 3.9:1 -- passes 3:1.
- Prefer `focus-visible` over `focus` to avoid showing rings on mouse click.

### Touch Targets (WCAG 2.5.8)

Minimum interactive target size: **24x24px** (AA), target **44x44px** (AAA / mobile).

| Element | Minimum Size | Implementation |
|---------|-------------|----------------|
| Icon-only buttons | `h-8 w-8` (32px) min, `h-10 w-10` (40px) preferred | Padding around icon |
| Nav items | `py-2.5 px-3` minimum | Ensures 40px+ hit area |
| Mobile list items | `min-h-[44px]` | Explicit minimum height |
| Close/dismiss buttons | `h-8 w-8` (32px) with `p-1.5` | Clickable area > icon size |

### Color Independence (WCAG 1.4.1)

Never use color as the **sole** means of conveying information:

- Status badges: include text label, not just colored dot
- Form errors: show error text + icon, not just red border
- Charts: use shape/pattern in addition to color; ensure legend text
- Links in body text: underline or other non-color differentiator

### Keyboard & Interaction

- Focus trapping: `focus-trap-react` for modals/dialogs
- Escape to close: Custom `useEscapeKey` hook for modals
- Skip links: Hidden skip-to-content link (`sr-only focus:not-sr-only`)
- Tab order: Logical, follows visual layout
- ARIA: Proper `role`, `aria-label`, `aria-expanded`, `aria-controls` on interactive elements

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Disabled States

- Visual: `disabled:opacity-50` (meets non-text contrast since it signals non-interactivity)
- Interaction: `disabled:pointer-events-none` or `disabled:cursor-not-allowed`
- ARIA: `aria-disabled="true"` when using non-button elements

### WCAG Checklist for New Components

Before shipping any new component, verify:

- [ ] Text meets 4.5:1 (normal) or 3:1 (large) against its actual background
- [ ] Icons meet 3:1 against their background (4.5:1 if icon-only interactive)
- [ ] Hover state is perceptible via multiple signals (not background-only on pale surfaces)
- [ ] Focus indicator is visible at 3:1 contrast, uses `focus-visible`
- [ ] Touch target is at least 32px (ideally 44px on mobile)
- [ ] Information is not conveyed by color alone
- [ ] Component is keyboard-operable with logical tab order
- [ ] Reduced motion is respected for any animation
- [ ] Appropriate ARIA attributes are present

### Z-Index Scale

| Value | Usage |
|-------|-------|
| `z-30` | Backdrops |
| `z-40` | Sticky headers, FAB |
| `z-50` | Modals, popovers, mobile menus |

---

## Scrollbar Styling

```css
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: var(--surface-raised);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--text-faint);
}
```

---

## Starter globals.css

Copy this into any new project as the foundation:

```css
@import "tailwindcss";

@theme inline {
  /* Brand scale */
  --color-squirrel-50: #eff6ff;
  --color-squirrel-100: #dbeafe;
  --color-squirrel-200: #bfdbfe;
  --color-squirrel-300: #93c5fd;
  --color-squirrel-400: #60a5fa;
  --color-squirrel-500: #3b82f6;
  --color-squirrel-600: #2563eb;
  --color-squirrel-700: #1d4ed8;
  --color-squirrel-800: #1e40af;
  --color-squirrel-900: #1e3a8a;

  /* Semantic surfaces */
  --color-surface: var(--surface);
  --color-surface-alt: var(--surface-alt);
  --color-surface-brand: var(--surface-brand);
  --color-surface-hover: var(--surface-hover);
  --color-surface-raised: var(--surface-raised);
  --color-surface-active: var(--surface-active);

  /* Semantic borders */
  --color-border: var(--border-color);
  --color-border-light: var(--border-light);

  /* Semantic text */
  --color-text-primary: var(--text-primary);
  --color-text-secondary: var(--text-secondary);
  --color-text-tertiary: var(--text-tertiary);
  --color-text-muted: var(--text-muted);
  --color-text-faint: var(--text-faint);

  /* Primary action */
  --color-primary: var(--primary);
  --color-primary-hover: var(--primary-hover);
  --color-primary-fg: var(--primary-fg);

  /* Interactive states */
  --color-interactive-selected-bg: var(--interactive-selected-bg);
  --color-interactive-selected-fg: var(--interactive-selected-fg);
  --color-interactive-selected-border: var(--interactive-selected-border);
  --color-interactive-hover-bg: var(--interactive-hover-bg);

  /* Fonts */
  --font-sans: var(--font-geist-sans), Arial, Helvetica, sans-serif;
  --font-mono: var(--font-geist-mono), monospace;
}

@variant dark (&:where(.dark, .dark *));

/* ─── Light Theme (default) ─── */
:root {
  --background: #ffffff;
  --foreground: #1e293b;
  --surface: #ffffff;
  --surface-alt: #f8fafc;
  --surface-brand: #eff6ff;
  --surface-hover: #f1f5f9;
  --surface-raised: #e2e8f0;
  --surface-active: #dbeafe;
  --border-color: #e2e8f0;
  --border-light: #f1f5f9;
  --text-primary: #1e293b;
  --text-secondary: #334155;
  --text-tertiary: #475569;
  --text-muted: #64748b;
  --text-faint: #94a3b8;
  --primary: #3b82f6;
  --primary-hover: #2563eb;
  --primary-fg: #ffffff;
  --interactive-selected-bg: #dbeafe;
  --interactive-selected-fg: #1d4ed8;
  --interactive-selected-border: #60a5fa;
  --interactive-hover-bg: #f1f5f9;
  --tab-active: #3b82f6;
}

/* ─── Dark Theme (One Monokai inspired) ─── */
.dark {
  --background: #282c34;
  --foreground: #abb2bf;
  --surface: #282c34;
  --surface-alt: #21252b;
  --surface-brand: #2c313a;
  --surface-hover: #2c313a;
  --surface-raised: #3e4451;
  --surface-active: #3e4451;
  --border-color: #3e4451;
  --border-light: #2c313a;
  --text-primary: #abb2bf;
  --text-secondary: #9da5b4;
  --text-tertiary: #7f8799;
  --text-muted: #636d83;
  --text-faint: #5c6370;
  --primary: #528bff;
  --primary-hover: #4070e0;
  --primary-fg: #ffffff;
  --interactive-selected-bg: #3e4451;
  --interactive-selected-fg: #61afef;
  --interactive-selected-border: #528bff;
  --interactive-hover-bg: #2c313a;
  --tab-active: #61afef;
}

/* ─── Base styles ─── */
body {
  background: var(--background);
  color: var(--foreground);
  font-family: var(--font-sans);
}

/* ─── Scrollbar ─── */
::-webkit-scrollbar { width: 8px; height: 8px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--surface-raised); border-radius: 4px; }
::-webkit-scrollbar-thumb:hover { background: var(--text-faint); }

/* ─── Animations ─── */
@keyframes dropdown-in {
  from { opacity: 0; transform: translateY(-6px); }
  to   { opacity: 1; transform: translateY(0); }
}
.dropdown-enter { animation: dropdown-in 0.16s ease-out both; }

@keyframes backdrop-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}
.backdrop-enter { animation: backdrop-in 0.15s ease-out both; }

@media (prefers-reduced-motion: reduce) {
  .dropdown-enter, .backdrop-enter { animation: none; }
}
```

---

## Quick Reference Card

```
Default Theme:     Light (dark is opt-in)
Brand Primary:     #3b82f6
Background:        #ffffff (light) / #282c34 (dark)
Text:              #1e293b (light) / #abb2bf (dark)
Border:            #e2e8f0 (light) / #3e4451 (dark)
Font:              Geist (sans), Geist Mono (mono)
Border Radius:     rounded-xl (cards), rounded-md (buttons), rounded-full (badges)
Shadows:           shadow-sm (rest) -> shadow-md (hover)
Transitions:       transition-colors (default), 150ms
Spacing:           4px base unit, p-4/p-6 for cards/pages
Max Width:         max-w-4xl for content
Icons:             lucide-react, h-5 w-5 standard
```
