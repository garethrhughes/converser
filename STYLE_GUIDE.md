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
12. [Accessibility](#accessibility)
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

### Strategy

- Class-based: `.dark` on `<html>` element
- Tailwind variant: `@variant dark (&:where(.dark, .dark *));`
- Persistence: `localStorage`
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

## Accessibility

### Conventions (from existing projects)

- Focus ring: `focus:border-squirrel-400 focus:ring-1 focus:ring-squirrel-400`
- Disabled state: `disabled:opacity-50` or `disabled:opacity-40`
- Keyboard navigation: Custom `useEscapeKey` hook for modals
- Focus trapping: `focus-trap-react` for modals/dialogs
- ARIA: Proper `role`, `aria-label`, `aria-expanded` on interactive elements
- Skip links: Hidden skip-to-content link
- Reduced motion: Respect `prefers-reduced-motion`

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
Brand Primary:     #3b82f6
Background:        #ffffff / #282c34
Text:              #1e293b / #abb2bf
Border:            #e2e8f0 / #3e4451
Font:              Geist (sans), Geist Mono (mono)
Border Radius:     rounded-xl (cards), rounded-md (buttons), rounded-full (badges)
Shadows:           shadow-sm (rest) -> shadow-md (hover)
Transitions:       transition-colors (default), 150ms
Spacing:           4px base unit, p-4/p-6 for cards/pages
Max Width:         max-w-4xl for content
Icons:             lucide-react, h-5 w-5 standard
```
