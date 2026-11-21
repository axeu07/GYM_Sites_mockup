# Tools

Helpers for the Fitness Solutions mockups in `../mockups`. Nothing here is deployed.

Setup (once): `npm install` (Playwright 1.64.1; uses the cached Chromium). All QA scripts serve `../mockups` over a local HTTP server themselves, because CSS logo masks do not load from `file://`.

## Everyday commands

| Command | What it does |
|---|---|
| `npm run check` | Broken relative links, then console errors and horizontal overflow on every page at 360 / 1440 / 2560 |
| `npm run interact` | Clicks every button, tab, chip and in-page link on every page; fails on any JS error (`-- --w=390` for phone) |
| `npm run previews` | Re-captures the chooser thumbnails in `mockups/shared/previews/` |
| `bash deploy/deploy.sh` | Deploys `mockups/` to Vercel. See "Deploy" below |

## QA scripts (`qa/`)

| Script | What it checks |
|---|---|
| `check.mjs [page]` | Console errors, failed requests and horizontal overflow |
| `interact.mjs [--page= --w=]` | Click-everything smoke test |
| `resp.mjs <page> <out-prefix>` | 15 devices: 4 phones, 5 tablets (portrait and landscape), 6 desktops up to 4K. Overflow, small tap targets, text pushed off-screen, errors, plus screenshots |
| `media.mjs [page] [--list]` | Every place a still or clip is shown; fails if a family (near-identical shots, or a clip plus the still taken from it) appears twice. Families are in `media/catalogue.json` |
| `doors.mjs` | Lights On: the closed lift doors leak no light at any frame edge, across 16 screen sizes and 4 display scalings (`--old` proves the test catches the original bug) |
| `jitter.mjs [page]` | Scroll settle on a large, uncapped-refresh screen: settle time, reversals, shaking elements |
| `perf.mjs [pages…] [--w= --h= --dpr= --cpu=]` | Idle CPU and per-frame cost while scrolling |
| `shot.mjs <page> <out-prefix>` | Full-page desktop, phone and reduced-motion screenshots |
| `scrollshots.mjs <page> <out-prefix> [w] [h]` | Viewport screenshots while wheel-scrolling (works with pinned sections) |
| `links.mjs` | Every relative `href` / `src` / `url()` resolves to a file |
| `hqcrawl.mjs` | Every hero-grade file a page requests is listed in `deploy/hq-keep.txt` (run before deploying) |
| `live.mjs [shots-dir]` | The deployed site: every page loads cleanly on a large monitor and a phone, by its link and by its bare folder address; private files are not served |

## Media pipeline (`media/`)

Sources live in `../_source/` (not deployed): curated originals from the client's Google Drive.

| File | Purpose |
|---|---|
| `selection.json` + `build_images.py <_source> <out>` | The 130 curated stills; re-encodes each at 1600px and 800px |
| `clips.txt` + `build_video.sh <ffmpeg> <src> <out> [name-regex]` | The 27 clips; cuts 720p loops, 16:9 crops and posters |
| `catalogue.json` | What every still and clip shows, and its family. Readable copy: `../research/media-catalogue.md` |
| `build_logo.py <logo.png> <out>` | Splits the logo into recolourable mark / wordmark / lockup masks and favicons |
| `previews.mjs`, `og-render.mjs` | Chooser thumbnails and the link-preview image |

## Deploy

```bash
npx vercel login                 # once per machine
bash deploy/deploy.sh            # deploys; DRY_RUN=1 builds the clean copy without uploading
```

The script deploys from a clean copy that leaves out the exFAT `._*` files and any still or clip no page refers to (about 61 MB). It adds `noindex` headers and a robots.txt, keeps the Vercel project link in `deploy/.vercel`, and writes the production address to `deploy/site-url.txt` so later runs include link previews for WhatsApp.
