# Revamp (16 Nov 2026): make all three directions more dynamic

The user's request: "Make all these demos more dynamic. Add some more elements that are dynamically aesthetic to all 3 mockups and revamp all three."

**Goal.** Each direction should feel alive: things respond to the cursor, to scroll and to time, and sections arrive with choreography rather than a plain fade. Motion must still read as the direction's own story (neon / printed prospectus / live consultation), not a generic animation pack. Treat this as a real revamp: you may restructure or redesign sections, add new ones, and replace weak ones. Keep the storyline, every working feature, the honesty tags and the media rules.

## What "dynamic" should mean here

Aim for a handful of memorable **signature moments** per direction, plus a consistent **motion system** underneath:

- **Signature moments (4–6 new or substantially upgraded):** large, story-specific effects people will remember and talk about. Examples: kinetic type that reacts to the cursor or scroll velocity, a light or ink sweep between sections, 3D tilt and glare on cards, a section that assembles itself as you arrive, a live element that changes with the time of day.
- **Motion system everywhere:**
  - Choreographed entrances: staggered, with directional masks or wipes instead of plain opacity.
  - Hover and press micro-interactions on every interactive element.
  - Magnetic or springy primary buttons.
  - Number tweens and charts that draw themselves.
  - Images with a subtle parallax or reveal crop.
  - Section-to-section transitions.
- **Ambient life:** a little continuous motion in places that are otherwise static. Examples: a marquee or ticker whose speed follows scroll velocity, a slowly drifting gradient or glow, a breathing light. Keep it restrained and pause it off-screen.
- **Touch equivalents:** phones and tablets get in-view or tap versions of every hover effect. Nothing important may be hover-only.

## Hard constraints (the user has complained about each of these before)

- **Scrolling must stay perfectly smooth on a 32" high-refresh monitor.**
  - Native scrolling only: no smooth-scroll or scroll-jacking library, no non-passive wheel or touch listeners.
  - Animate `transform` and `opacity` (and CSS variables feeding them).
  - No layout reads inside per-frame loops; batch reads before writes.
  - No `backdrop-filter` on fixed bars; no animated `filter: blur()` or SVG filters on large areas.
  - Position-linked scroll effects use smoothed scrub (numeric `scrub`) or are computed from a single cached geometry read.
- **Performance budgets** at 2560×1440@1.5, measured with `node qa/perf.mjs website/<slug>/index.html --w=2560 --h=1440 --dpr=1.5` on an idle machine.
  - Main-thread time per scroll frame:

    | Direction | Budget | Current |
    |---|---|---|
    | A | ≤ 4.5 ms | 3.4 ms |
    | B | ≤ 2.5 ms | 1.0 ms |
    | C | ≤ 3.0 ms | 1.8 ms |

  - Idle CPU once the intro has finished: ≤ 8%.
  - Every continuous effect (canvas, rAF loop, CSS animation) pauses when off-screen (IntersectionObserver) and when the tab is hidden.
  - Pointer-driven effects run only while the pointer moves, then settle and stop.
- **Jitter.** `node qa/jitter.mjs <slug>`: page scroll must show 0 reversals and settle in 0 ms. Intentional ambient motion (a marquee, a breathing glow) may appear as "shaking elements". That is acceptable only if each one is deliberate; list them in your report. Nothing that is meant to be still may move after scrolling stops.
- **Full width** stays (`--max: 100vw`, gutter clamp, root scale above 1920px). New sections must look composed at 390, 820, 1440, 2560 and 3840.
- **Media rules unchanged** (`research/finishing-brief.md`, `research/media-catalogue.md`).
  - One place per family per mockup.
  - Match by meaning; never caption a member as a coach.
  - `node qa/media.mjs <slug>` must stay ✓.
  - New sections may use unused stills and clips from the catalogue (130 stills, 27 clips); check the catalogue before choosing.
- **Accessibility:**
  - `prefers-reduced-motion: reduce` gets a calm, complete, static version: every piece of content visible, nothing essential animated.
  - The page also works if GSAP fails to load.
  - Keyboard focus is visible and Escape closes overlays.
  - Text over moving media keeps a scrim.
- **Lights On:** `node qa/doors.mjs` must still print "Doors sealed".
- **Ownership:** work only in your own direction's folder. Do not edit `mockups/shared/*`, `mockups/index.html`, `tools/` or the other directions. Report anything shared that needs changing.

## Approach

1. Look at your direction at 1440 and 2560 first, and note where it feels static or flat.
2. Pick your signature moments and design the motion system (timings, easings, stagger rules) as CSS variables and one small JS module, so motion is consistent.
3. Build, then look at real screenshots and short frame sequences of the moments (capture several frames during an animation) at 390, 820, 1440 and 2560.
4. Measure perf and jitter as you go, not only at the end.
5. Run the full QA list below and iterate until it is clean.

## QA to pass before reporting (from `tools/`)

- `node qa/check.mjs <slug>`
- `node qa/interact.mjs --page=<slug>`, then `--w=390` and `--w=820`
- `node qa/resp.mjs website/<slug>/index.html <scratch>/r --shots=top,mid` → "All devices clean"
- `node qa/media.mjs <slug>` → ✓ at 1440 and 390
- `node qa/perf.mjs website/<slug>/index.html --w=2560 --h=1440 --dpr=1.5` → within budget. Note the machine load (`uptime`) when you measure; other directions are being built in parallel, so re-run if the load average is above about 4.
- `node qa/jitter.mjs <slug>` → 0 reversals, 0 ms settle
- `node qa/shot.mjs website/<slug>/index.html <scratch>/full` → the reduced-motion screenshot shows the complete page
- Lights On only: `node qa/doors.mjs`

## Report back

- **Signature moments** added or upgraded: what each does, where, and its touch and reduced-motion behaviour.
- **Motion-system** summary.
- **Sections** restructured, added or removed.
- **Media changes**, if any.
- **Ambient motion** that jitter reports, with a reason for each.
- **Exact QA lines**, including the perf and load numbers.
- **Open issues.**
- **Screenshots:** 4–6 paths, including at least one frame sequence of a signature moment.

## Addendum: hero media must be high quality (user request, 16 Nov 2026)

"Make sure the photos and videos being used on the landing pages of all 3 mockups should be high quality." The first screen of each direction (the hero and anything visible on load) must look crisp on a 2560×1440 monitor and on 4K.

**What we found.**
- The raw camera clips are 1080×1920 and sharp at 100%. The shipped loops are 720p at CRF 27 (soft), and the `-wide` crops were upscaled to 1280×720.
- The client's 4K "film" is an upscale: soft and smeary, so do not use it as a sharp source.
- 20 stills come from a 24 MP camera (6224×4672), but they were shipped at 1600px.

**New hero-grade assets** (helpers in `shared/data.js`):

| Helper | What it gives |
|---|---|
| `FS.vidHQ(key[, wide])` / `FS.posterHQ(key[, wide])` | Native 1080×1920 at CRF 19 for every clip. `wide` is a native 1080×608 16:9 crop, available for floor, dumbbells, night, spin, reception, functional, rack, ropes, sign, cardio and studio. Encoding finishes shortly in `shared/video/hq/`; if a file is missing when you test, wait a minute and re-run. |
| `FS.imgXL(key)` | 2400px long edge, for the 20 keys in `FS.HQ_STILLS` |
| `FS.imgHero(key[, sm])` | 16:9 crop at 3200×1800 (`sm` = 1920×1080), focal points tuned, for `FS.HQ_STILLS` |

`FS.HQ_STILLS` = press-hex, press-hex-2, press-liftsweat, curl-woman, cable-beige, coach-rope, coach-rope-2, lateral-raise, lunge-step, coach-crunch, coach-seated, cable-tank, logo-cardio, ellipticals, treadmills, bag-red, bag-tall, turf-coach, turf-wide, turf-wide-2.

**Rules for the first screen:**
1. **Use HQ sources there.** Use `FS.vidHQ` and `FS.posterHQ`, not `FS.vid`, for any video on the first screen. Use `srcset` with the XL or hero renditions for any still on the first screen.
2. **Never upscale video past about 1.3×.** A video's on-screen pixel size must stay at or below roughly 1.3× its native resolution at 2560×1440 @1.5 and at 3840 @1. Native is 1080 wide portrait, or 1080×608 wide.
   - A full-bleed 2560-wide landscape hero cannot come from these clips sharply. Use a 24 MP still (`FS.imgHero`, with a slow GPU push-in or parallax for life), or a layout that shows video near native size: portrait windows, a triptych of portrait clips, or a contained frame.
   - Phones and tablets can use the portrait HQ clips full-bleed.
3. **Keep the first load reasonable.** Do not `preload="auto"` more than one HQ video on load; posters first; start further clips when in view.
4. **No repeats.** Hero stills and clips still count toward the no-repeat rule (`qa/media.mjs` now also recognises the hq, xl and hero folders).
5. **Show it.** In your report, list each first-screen asset with its rendered size against its source size at 2560 and 3840, and include a 100% crop screenshot of the hero at 2560.
