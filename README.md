# IKIGAI Fitness Club: website design directions

Three working, animated website mockups for **IKIGAI Fitness Club** (Doon Zone Tower, Jakhan, Rajpur Road, Dehradun), made for the client to review and choose from. They are front end only, but every link and button works. Each direction tells the club's concept, **“Four circles, one reason: find your reason to move”**, in a different way, with Japanese accents (生き甲斐 and others) set beside the English.

## What's here

| Path | What it is |
|---|---|
| `mockups/index.html` | Chooser page the client opens first: the three directions, what we found, and what to confirm |
| [ikigai-gym.vercel.app](https://ikigai-gym.vercel.app/) | **A · Ikigai Gym (生き甲斐).** The full live site (source: `Desktop\IKIGAI_GYM`): ikigai philosophy, programs, Boxing Club, Restore, coaches, tribe, reviews, plans and a WhatsApp free-trial pass |
| `mockups/website/c-ikigai/` | **B · Find your Ikigai (生き甲斐).** Interactive: the finder turns your goal into a circle and a week, plus a numbers calculator, an isometric stack of the four circles and a plan calculator |
| `mockups/website/a-akari/` | **C · Akari (灯).** Cinematic: the floor lights up, the wall slogan lights word by word, a lift ride through the four circles, a live timetable and a Boxing Club section |
| `mockups/shared/data.js` | Every fact, price, class and review theme in one place (`window.IK`). Each fact has a `confirm` / `sample` flag, and all three directions render from it |
| `mockups/shared/img`, `video`, `brand` | The club's own photos and clips (built by `tools/media/build_ikigai.sh`) and a **stand-in** logo |
| `research/ikigai-brief.md` | The project brief: confirmed facts, what to confirm, positioning, the four-circle concept, open questions |
| `research/directions.md` | What each direction does, section by section, and where every image comes from |
| `tools/` | QA (Playwright), media pipeline and deploy script. See `tools/README.md` |

## Ground rules followed
- No invented prices, trainer names, reviews or timetables are presented as real. Unknown prices show “Call for price”. The timetable is tagged **Sample**. Review themes are paraphrased and not quoted. Coaches other than Coach Arun are shown as roles, “name to confirm”.
- Japanese words are accents only and always appear beside the English.
- Brand cues kept from the club: black, white and the hexagon pattern, plus the four-circle sign on the door. Accent colours: ember `#FF5A1F` and hanko red `#D7261E`.

## Preview locally

Use a local web server, not `file://` (the CSS logo masks don't load from `file://`).

```bash
cd mockups && npx serve .        # or: python -m http.server 8080
```

## QA

From `tools/` (`npm install` once):

| Command | What it does |
|---|---|
| `npm run check` | Links, console errors and overflow at 360 / 1440 / 2560 |
| `npm run interact` | Clicks every control |
| `node qa/sections.mjs <page> <out-dir> [w] [h]` | One screenshot per section |

## Before the full build
Ask the client for the items on the chooser's “Please confirm” list: logo file, Sunday hours and the WhatsApp number, full prices including PT, the timetable, coach names and photos, women-only batches and trial policy, event dates, consent for transformations. Also ask for better photos of the steam room, washrooms, yoga and the team.
