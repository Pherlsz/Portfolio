# pherls.dev v2 design reference

Import order in `src/index.css`: `@import "tailwindcss";` then `./styles/tokens.css` then `./styles/animations.css`. Legacy `:root` tokens in `index.css` that share names (`--surface`, `--ink`, `--ink-soft`, `--muted`) must be removed or moved to `src/v1`, otherwise they override these. Dark mode is `html.dark`.

**Layers (back to front):** `bg` app > `rail` sidebar > `canvas` main sheet > `surface` cards > `surface-hover`. Tints: `surface-soft`, `accent-soft`, `warn-soft`. Lines: `border`, `border-strong`. Text: `ink` > `ink-soft` > `muted`. Action: `accent` / `on-accent` (charcoal in light, lime in dark). Brand highlight: `lime` / `on-lime`. State: `ok`, `warn`, `danger`. Code: `code-bg`, `code-ink`. Use as Tailwind colors (`bg-canvas`, `text-muted`, `border-border-strong`) or raw `var(--surface)`.

**Radii:** `rounded-sheet` 26px (main sheet, sidebar), `rounded-card` 22px (cards, composer), `rounded-inner` 18px (popovers, thumbnails inside cards), `rounded-control` 14px (inputs, small buttons), `rounded-pill` (chips, pills, avatar).
**Depth:** `shadow-card`, `shadow-float` (composer), `shadow-pop` (popovers). Raw: `var(--elevation-*)`. `ambient-glow` for the soft lime light behind empty states.
**Type:** `font-sans` Archivo (UI), `font-display` (greeting/titles, weight 700+, tracking -0.02em), `font-mono` Atkinson Mono (meta, budgets, paths, numbers with `tabular-nums`). Scale: `text-micro` 12 / `text-ui` 13 / `text-body` 15 / `text-lead` 17 / `text-title` 22 / `text-hero` fluid.

**Utility classes:** `.surface-card` (+ `.surface-card-interactive` for clickable lift), `.surface-sheet`, `.surface-composer` (accent border on focus-within), `.surface-popover`, `.pill-button` (34px pill; styles `[aria-expanded=true]` and `:disabled`), `.dot-canvas`, `.focus-ring` (put on every custom interactive element), `.r-slider` (range input; set `style={{ '--fill': '50%' }}`).
**Motion:** `.message-in` (new chat bubble), `.status-in` (status/text swap, remount with `key`), `.popover-in` (menus opening upward from the composer), mascot idles and `.mascot-hop` are internal to `Mascot.tsx`. Easing: `var(--ease-out)` default, `var(--ease-spring)` for playful pops. Durations 150 to 260ms.

**Components:**
- `<ReasoningSelect value onChange disabled />` from `src/chat/ReasoningSelect.tsx`: sits in the composer toolbar; popover opens upward. Pass `disabled` while streaming. No mascots inside it, ever.
- `<Mascot reasoning statusText? />` from `src/chat/Mascot.tsx`: mount only while thinking/streaming, in the assistant message slot. It owns its `role="status"` live region; do not wrap it in another live region.

**unslop-ui rules (enforced in review):**
1. Zero emojis in UI copy or code strings. Use lucide icons or inline SVG.
2. Zero em dashes and en dashes. Use a period, comma, colon, `·` or "a" for ranges (`2021 a 2026`).
3. Zero `transition-all` / `transition` blanket utilities. List properties (`transition-colors`, `transition-transform`, or `transition-property`). Keyframes and movement use only `transform` and `opacity`; hover states may also transition colors.
4. Zero decorative status dots. A dot must mean a real live state and carry text next to it.
5. No text below 12px (`text-micro`). No `text-[10px]` / `text-[11px]`.
6. Every animation must stop under `prefers-reduced-motion: reduce`.
7. Visible focus on everything interactive (`.focus-ring`). Hit targets at least 32px.
8. Copy in natural pt-BR, sentence case, no exclamation marks, no "Olá! Sou seu assistente".
