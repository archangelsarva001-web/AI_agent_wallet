

## Modernize UI/UX -- 2026 AI SaaS Aesthetic

This plan transforms the application from its current light-mode-first, flat design into a dark-first, glassmorphic, animated experience matching modern AI SaaS trends.

---

### 1. Global Theme -- Dark Mode First

**Files:** `index.html`, `src/index.css`, `src/main.tsx`

- Add Google Fonts imports for **Plus Jakarta Sans**, **Inter**, and **JetBrains Mono** in `index.html`.
- Set `defaultTheme="dark"` in `ThemeProvider` (`src/main.tsx`).
- Overhaul the `.dark` CSS variables in `src/index.css`:
  - Background: `#0A0A0B` (converted to HSL ~`0 0% 4%`)
  - Borders: Zinc-800 (`240 4% 16%`)
  - Cards: `bg-black/40` with `backdrop-blur-xl` and `border-white/10`
  - Update gradients and shadow/glow variables for dark-first aesthetics
- Update `:root` (light mode) variables to complement but keep dark as default.
- Add a CSS utility class `.spotlight-card` for the spotlight hover effect (radial gradient that follows the mouse, applied via a small JS handler).

**Files:** `tailwind.config.ts`
- Update `fontFamily.sans` to use `Plus Jakarta Sans` for headers and `Inter` for body.
- Add `fontFamily.mono` entry for `JetBrains Mono`.
- Add custom animation keyframes for `fade-in-up` (staggered dashboard load).

---

### 2. Typography Updates

**Files:** `index.html`, `tailwind.config.ts`, `src/index.css`

- Import `Plus Jakarta Sans` (weights 500-800), `Inter` (400-600), and `JetBrains Mono` (400) via Google Fonts.
- Set `font-sans` to `Inter` as the base body font.
- Add a utility class `font-display` mapped to `Plus Jakarta Sans` for headings.
- Apply `font-display` to all `<h1>`-`<h3>` elements via `@layer base`.

**Files:** `src/components/Header.tsx`
- Wrap the credits Badge value in a `<span className="font-mono">` to use JetBrains Mono.

---

### 3. Component Styling

**File:** `src/components/ui/card.tsx` -- Glassmorphism
- Change the base Card class from `rounded-lg border bg-card` to `rounded-xl bg-black/40 backdrop-blur-xl border border-white/10`.

**File:** `src/components/HeroSection.tsx` -- Gradient Glow
- Add a positioned `<div>` behind the headline with a purple-to-blue radial gradient (`from-purple-600/20 via-blue-600/10 to-transparent`) using `blur-3xl` for a soft glow effect.

**File:** `src/components/ui/button.tsx` -- Default Variant Update
- Update the `default` variant to include: `bg-primary text-primary-foreground hover:bg-primary/90 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)] border border-white/10 bg-gradient-to-b from-white/[0.08] to-transparent`.

---

### 4. Layout Refactor

**File:** `src/pages/Dashboard.tsx`

- **Omnibar:** Replace the current search + filter row with a large, centered search input styled with glassmorphism (`bg-black/30 backdrop-blur-xl border-white/10 rounded-2xl`), placed above the filters. Filters become a separate row of pill buttons below.
- **Masonry Grid:** Replace the uniform CSS grid with a CSS columns-based masonry layout using `columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-6` with `break-inside-avoid` on each card wrapper.
- **Staggered Fade-in:** Wrap each tool card in a div with `animate-fade-in` and an inline `animation-delay` based on index for a staggered entrance.

**File:** `src/components/ToolManagement.tsx`

- Replace the current `border rounded-lg p-4` list items with styled data cards:
  - Each card gets the glassmorphism treatment.
  - Add a status indicator dot: a small circle (`w-2 h-2 rounded-full`) with `bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.6)]` for Active/Approved, `bg-orange-500 shadow-[0_0_6px_rgba(249,115,22,0.6)]` for Pending, and `bg-zinc-500` for Inactive.

---

### 5. Animations and Interactions

**File:** `src/components/ToolCard.tsx`
- Add `hover:-translate-y-1 transition-all duration-300` (already partially present, ensure consistency).
- Add the spotlight hover effect by tracking mouse position via `onMouseMove` and setting a CSS custom property for a radial gradient overlay.

**File:** `src/pages/Dashboard.tsx`
- Add staggered `animate-fade-in` with `animation-delay` to each card and the welcome section.
- Add `hover:-translate-y-1` to the Account Status card.

**File:** `src/index.css`
- Add keyframe for `fade-in-up` with translateY and opacity.
- Add `.spotlight-card` utility with a `::before` pseudo-element using `radial-gradient` positioned via CSS custom properties (`--x`, `--y`).

---

### 6. Spotlight Card Effect (Detail)

A reusable spotlight effect applied to `ToolCard` and Dashboard cards:
- On `onMouseMove`, calculate cursor position relative to the card.
- Set `--spotlight-x` and `--spotlight-y` CSS variables on the element.
- A `::before` pseudo-element renders a `radial-gradient(circle at var(--spotlight-x) var(--spotlight-y), rgba(255,255,255,0.06), transparent 80%)`.
- This creates a subtle light-follow effect on hover.

Since pseudo-elements can't be directly controlled via Tailwind alone, this will be implemented as a small React wrapper component (`SpotlightCard`) or inline `onMouseMove` handler with a gradient `background` style on an overlay div.

---

### Summary of Files Modified

| File | Changes |
|------|---------|
| `index.html` | Add Google Fonts links |
| `src/main.tsx` | Set defaultTheme to "dark" |
| `src/index.css` | New dark-first CSS variables, spotlight utility, fade-in-up keyframe, font-display class |
| `tailwind.config.ts` | Update font families, add animations |
| `src/components/ui/card.tsx` | Glassmorphism base styles |
| `src/components/ui/button.tsx` | Inner glow + gradient border on default variant |
| `src/components/Header.tsx` | Monospace font on credits display |
| `src/components/HeroSection.tsx` | Purple-blue gradient glow behind headline |
| `src/components/ToolCard.tsx` | Spotlight hover effect, hover lift |
| `src/pages/Dashboard.tsx` | Omnibar, masonry layout, staggered animations |
| `src/components/ToolManagement.tsx` | Data cards with glowing status dots |

No new dependencies are required -- all animations use Tailwind CSS classes and vanilla JS mouse tracking. No `framer-motion` install needed.

