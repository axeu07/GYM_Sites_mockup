# Finishing pass (16 Nov 2026): brief for each direction

The user reviewed the mockups on a 32" monitor and asked for four things before the client sees them:

1. **Right photo, right subject.** Check every photo and video against what it is used for; remove anything that does not actually show that subject.
2. **No repeats.** No photo or video may appear twice within a mockup.
3. **Finish.** They found a hairline gap at the edge of the lift doors in Lights On and want that level of detail checked everywhere.
4. **Some extra polish** ("beautification"). Tasteful refinement, not a redesign.

## Already done centrally (do not redo)

- **More footage.** 51 new stills and 14 new clips were added, chosen to match specific subjects: step platforms, BOSU, spin riders, rowing with a coach, sled, air bike, boxing, kettlebells, the studio stage set with barbell and step, lockers, the street signboard, the front desk, the body-composition analyser. There are now 130 stills and 25 loops.
- **Catalogue.** `research/media-catalogue.md` (readable) and `tools/media/catalogue.json` describe what every still and clip shows and group them into **families**: near-identical shots, and a clip together with the still taken from it.
- **`shared/data.js`.**
  - Every programme's `img` / `video` now shows that programme, and none is shared with another programme or a floor.
  - `video` is `null` for Bhangra and Zumba (no class footage exists; their stills show the group studio). `FS.vid(null)` and `FS.poster(null)` return `""`. Render the still only.
  - Each floor has `more: [...]`, four extra stills of that floor.
  - `FS.poster("film")` is now a real frame.
- **Lights On lift doors.** Fixed: the doors overshoot the frame by 3px and the picture is hidden once they are shut. `node qa/doors.mjs` proves it (256 edge checks). Do not regress it.
- **Audit tool.** `node qa/media.mjs <slug>` loads the page at 1440 and 390, lists every place media is shown and fails on a repeated family.

## 1 and 2. Media rules

- **One place per family per mockup.** A `<video>` with its own poster, or a photo with its own hover clip in the same box, is one place. Enlarging something already on the page (lightbox, drawer, detail sheet) is not a second place.
- **Interactive states count.** Media that only appears on hover, in another tab, or in a drawer for a *different* item must not repeat a family shown elsewhere. The tool cannot see these, so check them by hand and list them in your report.
- **Soft limits.** At most 2 purple dumbbell-rack families and at most 3 wide strength-floor views per mockup, never adjacent.
- **Match by meaning.** Use a shot only for what its catalogue description says.
  - `functional-coach` is a member on the SkiErg, not a coach.
  - Coaching slots take coaching shots only.
  - Never name a person in a photo.
- **No fit, no photo.** Where no shot fits a subject, use a designed treatment without a photo (type, pattern, colour, icon) instead of a loosely related picture.
- **Target:** `node qa/media.mjs <slug>` prints ✓ at both widths.

## 3. Finish checklist

Look at real screenshots at **390, 820, 1440 and 2560** wide (2560×1440 is the user's screen; the layout is full width there). Check:

- **Edges and seams:** hairlines, 1px gaps, anything peeking past a rounded corner, clipped shadows or glows, mismatched radii, borders that double up.
- **States:** hover, focus, pressed, selected, disabled; every drawer, modal, menu, accordion, tab and tooltip opened and closed; frames captured mid-transition.
- **Scroll-driven sections:** at their first and last pixel, and when scrolled past quickly. Nothing may jump, flash or stay half-finished.
- **Text:** headings with a single orphaned word, truncated labels, text touching an edge, text over a busy image without a scrim, inconsistent capitalisation or punctuation, numbers and ₹ formats.
- **Images:** heads or key subjects cropped out (`object-position`), stretched or visibly soft pictures, wrong aspect ratios, posters that flash before a clip plays.
- **Rhythm:** uneven section spacing, misaligned columns, large empty areas at 2560.
- **Function:** every button and link still does something real; booking flow end to end; keyboard focus order; Escape closes overlays.

## 4. Polish

Choose refinements that make the direction feel more finished and more itself. Good candidates are places where the new, better-matched footage lets a section become richer. Keep it restrained: nothing that slows scrolling, nothing gimmicky.

## Constraints

- Work only in your own folder. Do not edit `mockups/shared/*`, `mockups/index.html`, `tools/` or other directions. Report problems instead.
- Native scrolling only: no smooth-scroll library, no non-passive wheel or touch listeners.
- No `backdrop-filter` on fixed bars.
- Keep the full-width layout (`--max: 100vw`, the gutter clamp, the root scale above 1920px).
- Keep reduced-motion and no-GSAP fallbacks working.

## QA to pass before reporting (from `tools/`)

- `node qa/check.mjs <slug>`
- `node qa/interact.mjs --page=<slug>`, then `--w=390` and `--w=820`
- `node qa/resp.mjs website/<slug>/index.html <scratch>/r --shots=top,mid` → "All devices clean"
- `node qa/media.mjs <slug>` → ✓ at 1440 and 390
- `node qa/perf.mjs website/<slug>/index.html --w=2560 --h=1440 --dpr=1.5` and `node qa/jitter.mjs <slug>`: no worse than before
- Lights On only: `node qa/doors.mjs` → "Doors sealed"

## Report back

- The media allocation: each slot and the still or clip it now uses, plus anything removed and why.
- Finish bugs found and fixed.
- Polish added.
- The exact QA result lines.
- Anything you could not resolve, such as subjects with no footage.
