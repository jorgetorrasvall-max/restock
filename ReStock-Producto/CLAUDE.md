# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Static frontend for ReStock — a B2B marketplace for surplus/overstock inventory. No build step, no framework, no package manager. Open any `.html` file directly in a browser to develop.

## Architecture

**CSS split:**
- `styles.css` — landing page only (`index.html`)
- Platform pages (marketplace, producto, mensajes, perfil, publicar, login, admin) use **Tailwind CDN** via `<script src="https://cdn.tailwindcss.com">` with a custom inline config — no `app.css`

**JS files:**
- `app.js` — landing page only (`index.html`); handles landing nav, tabs, alpha code form, intersection observers
- `data.js` — all mock data as `const` globals; also exports helper functions (see below)
- `shared.js` — auth utils; loaded by every platform page, never by `index.html`

**Script loading order for platform pages:** `data.js` → `shared.js` → inline `<script>` at bottom of `<body>`. There are no separate per-page `.js` files; all page logic is inline.

**Data layer (`data.js`):**  
Globals: `PRODUCTS`, `MOCK_USERS`, `MOCK_CONVERSATIONS`, `ALPHA_CODES`, `CATEGORIES`, `CONDITIONS`. No API — prototype only.

Helper functions exported from `data.js`:
- `getCommission(price)` → `{ buyer, seller, total }` (percentages)
- `getCategoryName(id)` / `getCategoryIcon(id)`
- `daysAgo(dateStr)` → human string
- `formatPrice(n)` → `"1.200€"`
- `stars(rating)` → HTML string with `star-full/half/empty` spans

**Auth (`shared.js`):**  
`localStorage` key `rs_user` holds the logged-in user object. Public API: `getUser()`, `setUser(user)`, `logout()`, `requireAuth()`, `getParam(key)`, `showToast(msg, type)`. `initNav()` / `initNavSearch()` / `initMobileNav()` run automatically on `DOMContentLoaded`.

**Commission logic (`data.js` → `getCommission(price)`):**
- `< 500€` → 5% buyer + 5% seller
- `≥ 500€` → 4% + 4%
- `≥ 1000€` → 3% + 3%

**Page routing:** Query params only. `getParam(key)` reads `URLSearchParams`. Examples: `producto.html?id=3`, `marketplace.html?q=moda&cat=electronica`.

## Tailwind design tokens (platform pages)

Each platform page declares an identical `tailwind.config` block with these custom tokens:

```js
colors: {
  paper: '#FDFBF7',      // warm off-white background
  navy: '#1A3C6E',       // primary brand
  'navy-dark': '#142d54',
  gold: '#E8A020',       // accent
  'gold-light': '#FEF3DC',
  ink: '#1A1A1A',        // body text
  muted: '#5C5C5C',      // secondary text
  warm: '#E8E4DC',       // borders / dividers
}
fontFamily: {
  serif: ['Newsreader', 'Georgia', 'serif'],  // headings, prices
  sans:  ['Inter', 'system-ui', 'sans-serif'] // body, UI
}
```

## Key constraints

- `index.html` uses `styles.css` + `app.js` only — completely separate from the platform.
- The Founder badge (`⭐ Fundador ReStock`) is controlled by `user.isFounder` in `MOCK_USERS`.
- Alpha codes follow the pattern `RESTOCK-ALPHA-001` to `RESTOCK-ALPHA-020`; used status tracked in `ALPHA_CODES` in `data.js`.
- Admin user is `id: 0` (jorgetorrasvall@gmail.com) — only user with `isAdmin: true`.
- When adding a new platform page, copy the Tailwind config block verbatim from an existing page and load scripts in order: `data.js` → `shared.js` → page script.
