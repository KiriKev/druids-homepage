# Druids — homepage

Editorial portfolio for **Kevin Germin** (Druids) — visual artist, copywriter & consultant.

Static HTML/CSS/JS prototype. React 18 + Babel loaded from CDN in the browser — no build step.

## Run locally

Serve the directory with any static file server.

```bash
npx --yes http-server . -p 5173 -c-1 --cors
# → http://localhost:5173/
```

## Layout

| File | Purpose |
|---|---|
| [`index.html`](index.html) | Entry — loads React, Babel, and the JSX/JS modules |
| [`work.html`](work.html) | Archive page — every entry of `work.json` as a filterable, justified grid (`<body data-page="archive">` switches `portfolio.jsx` to `ArchivePage`) |
| [`work.json`](work.json) | Portfolio manifest — one entry per clip, feeds the **Work** rail and the archive, newest first by `date` |
| [`portfolio.jsx`](portfolio.jsx) | Page composition + `Nav`, `Hero`, `Services`, `Work` (reel), `Approach`, `Tools`, `Builder`, `Testimonials`, `CTA`, `Footer`, lightbox, and the shared `VideoPlayer` |
| [`i18n.jsx`](i18n.jsx) | EN / DE / RU translations + the language switching machinery |
| [`helix.jsx`](helix.jsx) | Hero and spine double-helix SVG components |
| [`portfolio.css`](portfolio.css) | All styling |
| [`image-slot.js`](image-slot.js) | `<image-slot>` custom element used for drop-in images |
| [`tweaks-panel.jsx`](tweaks-panel.jsx) | Edit-mode tweak controls (palette / spine / grain) |
| `images/`, `logos/`, `videos/`, `uploads/` | Static assets |

## Customise

- **Calendly link:** `CALENDLY_URL` at the top of [`portfolio.jsx`](portfolio.jsx).
- **PsyopAnime recognition video:** `RECOGNITION_VIDEO_SRC` at the top of `portfolio.jsx`.
- **Portfolio:** append to [`work.json`](work.json); no code or translation changes needed. Bump `?v=` on `REEL_MANIFEST` in `portfolio.jsx` if a CDN caches it.
- **Copy / translations:** [`i18n.jsx`](i18n.jsx).

## Adding a piece to the reel

```json
{ "id": "2026-09-01-acme-loop-03", "date": "2026-09-01", "kind": "brand",
  "client": "Acme", "title": "Loop 03", "src": "https://<bucket>/acme-03.mp4",
  "aspect": "9/16", "poster": "posters/acme-03.webp",
  "series": "acme-2026", "seriesTitle": "Acme · running content", "ongoing": true }
```

| Field | Meaning |
|---|---|
| `kind` | `brand` or `short` — drives the filter chips and the Services deep links |
| `series` | Clips sharing a key collapse into **one** tile with a clip count; opening it plays the whole series in the lightbox. Use for retainer / ongoing brand content. `seriesTitle` names the tile (falls back to `client`), `ongoing: true` adds the badge. |
| `aspect` | Real ratio (`16/9`, `9/16`, `1/1`, `4/5`) — the rail sizes each tile from it, so formats show at true proportion |
| `poster` | Optional WebP; without one the first frame is used (costs a metadata request per tile) |
| `title` · `client` · `body` · `seriesTitle` | Plain string, or `{ "en": …, "de": …, "ru": … }`. `body` is the editorial paragraph shown in the lightbox caption. |
| `src` | Relative path or full URL. Host videos off-repo (Cloudflare R2 / Vercel Blob) — Git is not a CDN. |

The home rail shows the newest 10 entries (series count as one); `work.html` shows all.
