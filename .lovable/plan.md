

## Update ToolCard with Hover Effects, Grain Texture, and Neon Button

Three visual enhancements to `src/components/ToolCard.tsx`:

---

### 1. Icon Scale on Hover

Add a `transition-transform duration-300 group-hover:scale-110` class to the icon container (the `<div className="text-2xl">` element) so it scales up to 1.1x when the card is hovered.

---

### 2. Border Glow on Hover

Update the `Card` element's border to transition from `border-white/5` to a lit-up purple border on hover. Add `border border-white/5 hover:border-primary/50` alongside the existing `hover:shadow-glow` for a coordinated glow effect.

---

### 3. Grain Texture Background

Add the existing `bg-noise` utility class to the `Card` component. This applies the subtle SVG fractal noise overlay already defined in `index.css`, giving the card a film-grain texture.

---

### 4. Neon "Use Tool" Button

Replace the flat default button styling with a neon glow effect when the user can afford the tool:

- Add custom classes: `bg-primary shadow-[0_0_15px_hsl(var(--primary)/0.5),0_0_30px_hsl(var(--primary)/0.2)] hover:shadow-[0_0_20px_hsl(var(--primary)/0.6),0_0_40px_hsl(var(--primary)/0.3)]`
- Add a subtle text glow via `[text-shadow:0_0_10px_hsl(var(--primary)/0.5)]`
- Keep the `group-hover:` intensification so the neon effect strengthens when hovering the card

The "Need Credits" disabled state stays as a muted secondary button with no glow.

---

### Summary

| Change | Implementation |
|--------|---------------|
| Icon scale | `transition-transform duration-300 group-hover:scale-110` on icon div |
| Border glow | `border-white/5 hover:border-primary/50` on Card |
| Grain texture | Add `bg-noise` class to Card |
| Neon button | Custom `shadow` and `text-shadow` with primary color glow on the "Use Tool" button |

Single file change: `src/components/ToolCard.tsx`

