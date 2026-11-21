# Fitness Solutions: website design directions

These are three working, animated website mockups for **Fitness Solutions** (Laxman Chowk, Dehradun, "A Complete Fitness Academy", est. 2009), made for the client to review and choose from. They are front end only, but every link and button works. They follow the IdeasSPORTS mockup approach: a chooser page and three story-led directions that share one data file.

## What's here

| Path | What it is |
|---|---|
| `mockups/index.html` | Chooser page the client opens first: the three directions, what we found, and what to confirm |
| `mockups/website/a-lights-on/` | **A · Lights On.** Cinematic neon: hexagon-lamp hero, elevator through the four floors, live timetable |
| `mockups/website/b-academy/` | **B · The Academy.** A 2026–27 prospectus: admit-card admission form, course catalogue, yearbook history, EN / हिं |
| `mockups/website/c-solutions/` | **C · Fitness, Solved.** Interactive consultation: solution engine, know-your-numbers calculator, 3D building |
| `mockups/shared/data.js` | Every fact, price, class and review in one place. All three directions render from it |
| `mockups/shared/img`, `video`, `brand` | Curated photos (79), video loops (11, plus the film and a testimonial), and recolourable logo masks |
| `research/research-notes.md` | Research on the gym (website, 2017 archive, Justdial, FITPASS, Instagram, Facebook, competitors) with sources |
| `research/directions.md` | Brief and spec for each direction |
| `tools/` | QA (Playwright), media pipeline and deploy script. See `tools/README.md` |
| `_source/` | Curated originals from the client's Google Drive (not deployed) |

## Preview locally

Use a local web server. Opening the files directly (`file://`) blocks the CSS logo masks, so the logos would disappear.

```bash
cd "/Volumes/HP P900/Fitness Studio/mockups" && python3 -m http.server 8080
# then open http://localhost:8080
```

## Deploy to Vercel (free Hobby plan)

```bash
npx vercel login                      # once
cd "/Volumes/HP P900/Fitness Studio/tools"
bash deploy/deploy.sh                 # first deploy prints the URL
SITE_URL=https://<project>.vercel.app bash deploy/deploy.sh   # redeploy with WhatsApp/LinkedIn link previews
```

The script:
- Deploys from a clean copy, leaving out the exFAT `._*` files (~53 MB).
- Adds `noindex` headers and a robots.txt so the demo stays out of Google.
- Remembers the Vercel project, so later runs update the same URL.

## QA

From `tools/`:

| Command | What it does |
|---|---|
| `npm run check` | Checks links, console errors and overflow |
| `npm run interact` | Clicks every control |
| `node qa/resp.mjs <page> <out>` | Sweeps 15 devices: phones, tablets in portrait and landscape, and desktops up to 4K |

## Before the full build

Confirm the items on the chooser's "Please confirm" list:
- Hours
- Founding year
- Which zone is on which floor
- Timetable
- Which phone number to publish
- Instagram handle
- Les Mills licence
- Director credentials
- What membership includes
- Permission to show member results and the testimonial

We also need these from the client:
- A vector logo
- Team photos
