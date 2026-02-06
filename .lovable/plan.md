

## Refactor Dashboard to Bento Grid Layout

Replace the current masonry columns layout with a CSS Grid-based "Bento Grid" that gives distinct sizing to different content areas.

---

### 1. Floating Search Bar with Purple Glow

Replace the current Omnibar section with a floating, fixed-position-style search bar that has a purple radial glow behind it:

- Wrap the search input in a container with `relative` positioning
- Add a `::before`-style purple glow div behind it: `absolute inset-0 bg-purple-600/20 blur-3xl rounded-full -z-10`
- Keep the glassmorphism styling on the input (`bg-black/30 backdrop-blur-xl border-white/5 rounded-2xl`)
- Make it visually "float" with extra padding, a subtle shadow, and `z-10`

---

### 2. Bento Grid Layout

Replace the `columns-1 md:columns-2...` masonry with a CSS Grid bento layout using explicit `grid-template-columns` and `grid-row` spans.

**Top section (Welcome + Account Status):**
- Use a 4-column grid: `grid grid-cols-1 lg:grid-cols-4 gap-6`
- Welcome text spans 3 columns: `lg:col-span-3`
- Account Status card spans 1 column but 2 rows tall: `lg:col-span-1 lg:row-span-2` -- making it the tall vertical card on the right

**Featured Tools grid:**
- Use `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6`
- First 2 featured tools get large square sizing: `md:col-span-1 md:row-span-2 aspect-square` (or min-height to approximate square)
- Remaining featured tools use standard 1x1 cells
- Each tool card wrapped in `SpotlightCard`

**Coming Soon grid:**
- Standard `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6`
- All cards 1x1, wrapped in `SpotlightCard` with the opacity overlay

---

### 3. Wrap All Tool Cards in SpotlightCard

Currently `ToolCard` has its own inline spotlight effect. In the Dashboard render, wrap each `ToolCard` in the `SpotlightCard` component for consistency. The `ToolCard`'s own spotlight overlay will layer with `SpotlightCard` for a richer effect.

---

### 4. Account Status as Tall Vertical Card

- Remove the `lg:w-80` constraint on the Account Status `SpotlightCard`
- Instead, place it in the grid with `lg:row-span-2` so it stretches vertically alongside the welcome text and the search bar rows
- Add `h-full` to the inner Card so it fills the tall cell
- Add extra content to fill the vertical space: a small usage progress bar or additional stats

---

### 5. Filtered/Search Results

When searching or filtering, switch to a flat bento grid (`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6`) with all cards wrapped in `SpotlightCard`.

---

### Summary of Changes

| File | Changes |
|------|---------|
| `src/pages/Dashboard.tsx` | Replace masonry layout with CSS Grid bento; floating search with purple glow; wrap tool cards in SpotlightCard; Account Status as tall vertical card in grid |

Single file change -- all modifications are within `Dashboard.tsx`. No new components or dependencies needed.

---

### Technical Detail

The bento grid structure in JSX will look roughly like:

```text
<div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
  <!-- Welcome text: col-span-3 -->
  <!-- Search bar: col-span-3 (with purple glow) -->
  <!-- Account Status: col-span-1, row-span-2 (tall) -->
</div>

<!-- Featured Tools -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
  <!-- First 2 tools: aspect-square or row-span-2 for large squares -->
  <!-- Rest: standard 1x1 -->
</div>

<!-- Coming Soon -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
  <!-- All 1x1 with opacity overlay -->
</div>
```
