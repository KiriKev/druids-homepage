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
| [`portfolio.jsx`](portfolio.jsx) | Page composition + `Nav`, `Hero`, `Services`, `Work`, `Approach`, `Tools`, `Builder`, `Testimonials`, `CTA`, `Footer`, lightbox, and the shared `VideoPlayer` |
| [`i18n.jsx`](i18n.jsx) | EN / DE / RU translations + the language switching machinery |
| [`helix.jsx`](helix.jsx) | Hero and spine double-helix SVG components |
| [`portfolio.css`](portfolio.css) | All styling |
| [`image-slot.js`](image-slot.js) | `<image-slot>` custom element used for drop-in images |
| [`tweaks-panel.jsx`](tweaks-panel.jsx) | Edit-mode tweak controls (palette / spine / grain) |
| `images/`, `logos/`, `videos/`, `uploads/` | Static assets |

## Customise

- **Calendly link:** `CALENDLY_URL` at the top of [`portfolio.jsx`](portfolio.jsx).
- **PsyopAnime recognition video:** `RECOGNITION_VIDEO_SRC` at the top of `portfolio.jsx`.
- **Work tile media:** `WORK_MEDIA` array in `portfolio.jsx`.
- **Copy / translations:** [`i18n.jsx`](i18n.jsx).
