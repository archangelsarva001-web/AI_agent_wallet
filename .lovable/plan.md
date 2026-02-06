

## Modernize Design System -- Deeper Dark Theme + Noise Texture

Three targeted changes to refine the existing dark-first design system.

---

### 1. Update dark background in `src/index.css`

The `.dark` background variable changes from `240 6% 4%` to the richer `240 10% 3.9%`. This gives a slightly more saturated, deeper dark base.

Add a new `.bg-noise` utility class in the `@layer components` block that applies a subtle SVG noise texture overlay using a base64-encoded inline SVG pattern with low opacity, creating a film-grain effect:

```css
.bg-noise {
  position: relative;
}
.bg-noise::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,..."); /* tiny noise SVG */
  opacity: 0.03;
  pointer-events: none;
  z-index: 0;
}
```

---

### 2. Confirm typography in `tailwind.config.ts`

The font families are already correctly configured:
- `font-display` -> Plus Jakarta Sans (headers)
- `font-sans` -> Inter (body)
- `font-mono` -> JetBrains Mono

No changes needed here -- the config already matches the request.

---

### 3. Update Card glassmorphism in `src/components/ui/card.tsx`

Change the Card base class from:
`bg-card/40 backdrop-blur-xl border border-white/10`

To the more subtle:
`bg-black/20 backdrop-blur-xl border border-white/5`

This makes cards more transparent with a softer border, giving a more refined glass effect against the deeper background.

---

### Summary of Changes

| File | Change |
|------|--------|
| `src/index.css` | Dark background to `240 10% 3.9%`; add `.bg-noise` utility class |
| `tailwind.config.ts` | No changes needed (already correct) |
| `src/components/ui/card.tsx` | Card class: `bg-black/20 backdrop-blur-xl border border-white/5` |

