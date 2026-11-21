# Fitness Solutions: three design directions (build brief)

Each direction is a working, animated, single-page website mockup that tells a different story about the same gym. All three render content from `mockups/shared/data.js` (`window.FS`). The design ideology follows the IdeasSPORTS mockups:
- One named concept per direction
- A distinct colour and type trio
- Three signature interactions
- A themed loader
- Honest "Illustrative" / "To confirm" tags
- Every control works

---

## Shared rules (all directions)

### Files
- **Location:** each direction lives in `mockups/website/<slug>/` with `index.html`, `style.css` and `main.js`.
- **Own folder only.** Work only in your direction's folder. Do not edit `mockups/shared/*`. If you need local data, put it in `main.js`.
- **Ignore `._*` files.** The drive is exFAT and creates them automatically.
- **Script order:** at the end of `<body>`, load:
  1. `../../shared/data.js`
  2. GSAP 3.12.5 and ScrollTrigger from cdnjs (`https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js` and `.../ScrollTrigger.min.js`)
  3. `main.js`
- **No smooth-scroll library.** Lenis was removed on 15 Nov 2026: it scrolls on the main thread and keeps gliding after you stop, which judders on high-refresh or large monitors (the user saw it on a 32" LG UltraGear). Use native scrolling, `window.scrollTo({ behavior: "smooth" })` for anchors, and ScrollTrigger with numeric `scrub` (not `true`) for anything position-linked.
- **Degrade gracefully** if GSAP or Lenis fail to load (`HAS_GSAP` check) and under `prefers-reduced-motion`: no pinning or scrubbing, all content visible.
- **Fonts:** Google Fonts with preconnect.

### Head
- `<meta name="robots" content="noindex, nofollow">` (this is a client demo)
- `<title>`, meta description, `theme-color`
- `<link rel="icon" href="../../shared/brand/favicon-32.png">` and `<link rel="apple-touch-icon" href="../../shared/brand/favicon-180.png">`

### Logo
The logo comes as white transparent PNG masks: `../../shared/brand/lockup.png` (mark + "Fitness Solutions"), `mark.png` (figure in crescent) and `wordmark.png`. Recolour them with CSS:

```css
.logo { background: currentColor; -webkit-mask: url(...) center/contain no-repeat; mask: url(...) center/contain no-repeat; aspect-ratio: 936/265; }
```

- `mark.png` is 274×265; `wordmark.png` is 691×208.
- Set "A Complete Fitness Academy" as live text, never as an image.

### Media
- **Images:** `FS.img(key)` (1600px long edge) and `FS.img(key, true)` (800px). Use `srcset` with both and `loading="lazy"` below the fold. Most images are portrait 9:16 or 3:4. Landscape images: `ellipticals`, `logo-cardio`, `treadmills`, `turf-wide`, `turf-wide-2`.
- **Videos:** `FS.vid(key)` is a 720×1280 portrait loop; `FS.vid(key, true)` is the 1280×720 crop. Posters: `FS.poster(key[, wide])`.
  - Loops: `floor`, `dumbbells`, `cable`, `row`, `night`, `spin`, `reception`, `hoodie`, `functional`, `rack`, `ropes`.
  - Wide crops exist for `floor`, `dumbbells`, `night`, `spin`, `reception`, `functional`, `rack`, `ropes`.
  - With sound, played only on demand in a modal: `film` (59 s, the client's own edited reel) and `voice-senior` (41 s, a senior member's on-camera testimonial in Hindi).
  - Loops must be `muted playsinline loop preload="metadata"` with a poster, and play only while in view (IntersectionObserver).
- **Image keys:** bag-neon bag-red bag-tall bosu building building-2 cable-beige cable-tank cable-violet cable-violet-2 cardio-pair cardio-windows coach-chest coach-crunch coach-floor coach-portrait coach-press-2 coach-press-hex coach-rope coach-rope-2 coach-seated consult curl-hex curl-woman deadlift-belt deadlift-floor dumbbells-angle dumbbells-close dumbbells-purple dumbbells-rack ellipticals entrance entrance-2 floor-cable floor-dark floor-hex floor-hex-2 floor-wide floor-wide-2 functional-coach functional-sign hammer-woman hoodie-curl lateral-raise logo-cardio logo-cardio-2 logo-sign logo-wall lunge-step manager member-senior member-woman mobility-zone night-exterior night-exterior-2 plates press-hex press-hex-2 press-liftsweat purple-coach-woman purple-row purple-seated reception-neon reception-neon-2 red-machines ropes-entrance ropes-entrance-2 ropes-entrance-3 spin-row spin-studio studio-stage train-hard treadmill-row treadmills turf-class turf-coach turf-wide turf-wide-2 xpeed-bag
- **What's in the frames:**
  - The real neon signs: `press-liftsweat` ("LIFT SWEAT REPEAT"), `coach-crunch` ("CONSISTENCY DISCIPLINE"), `train-hard` ("TRAIN HARD" neon), `functional-sign` ("FUNCTIONAL TRAINING").
  - Logo and reception: `reception-neon` (logo wall in purple), `logo-sign` (logo on a green wall).
  - Building and street: `building` (exterior), `entrance` (checkered-floor entrance), `night-exterior`.
  - Members on camera: `member-senior` (senior woman member), `member-woman` (young woman member).
  - Coaching moments: `coach-*`.
- **Never name a person in a photo.** We don't know which trainer is who; coaching photos are generic.

### Honesty tags
- Anything with `sample: true` gets a small "Illustrative" tag.
- Anything with `confirm: true` gets a small "To confirm" tag. This covers hours, floor order, the timetable, Instagram, the director's credentials and similar items.
- Keep the tags small, consistent and styled to the direction.

### Links and controls
Every link and button must do something real:
- In-page anchors and modals or drawers
- `FS.wa(text)` for WhatsApp
- `FS.contact.phoneHref` for calls
- `mailto:` for email
- `FS.contact.mapsUrl` for directions
- Instagram and Facebook (`target="_blank" rel="noopener"`)

No `href="#"` dead ends.

Also:
- Add a small fixed "← All directions" pill linking to `../../index.html`, styled to the direction.
- **Booking must work end to end, frontend only:**
  1. Validate the input (name required; Indian mobile is 10 digits starting 6–9; +91 optional).
  2. Show a confirmation.
  3. Offer a prefilled WhatsApp message (`FS.wa`) and an "Add to calendar" download (`FS.ics({title, start: FS.istDate(offset, "HH:MM"), minutes, details})`).
  4. Escape closes modals. Focus moves into the dialog and returns afterwards.

### Layout
- **Fluid root:** `html { font-size: clamp(16px, 0.42vw + 9.9px, 20px); }`. Use rem everywhere.
- **Full width, no centred column** (the user asked on 15 Nov 2026 for sites to cover the whole screen): `--max: 100vw`, gutters `clamp(16px, calc(4vw + 4px), 12rem)`. Above 1920px the root keeps scaling — `@media (min-width: 1921px) { html { font-size: max(18px, min(calc(0.78vw + 3px), calc(1.39vh + 3px))); } }` — so big monitors show the whole composition larger instead of side gaps (height-limited on ultrawides).
- **Widths:** must work from 320px to 3840px edge to edge with no horizontal overflow (`overflow-x: clip` on html/body).
- **Touch:** tap targets ≥ 40px on touch screens.
- **Reading:** measure ≤ ~70 characters.
- **Mobile is first-class**, not a squeezed desktop. The portrait videos are a gift on phones.

### Performance and accessibility
- **No idle animation loops.** Pause canvas or rAF work when it's off-screen or the tab is hidden.
- **Animation:** use `transform`/`opacity`. Lazy-load the map `<iframe loading="lazy">`.
- **Semantics:** use landmarks, alt text, visible focus states and `aria-live` for dynamic results. Buttons are `<button>` elements.

### Copy
- **Indian English.** Use ₹ with en-IN grouping (`FS.money`). Phone format: +91 99172 82333.
- **Reuse the client's own lines from `FS.brand.lines`.**
  - "Fitness is not a punishment. It's a practice."
  - "No random workouts. No copy-pasted routines."
  - "The first treadmill in the city belonged to us."
- **Don't invent facts:** no member counts, awards or celebrity links. Illustrative content must be tagged.

### QA before you report back (tools in `tools/`)
- `node qa/check.mjs <slug>`: no console errors and no overflow at 360, 1440 and 2560.
- `node qa/interact.mjs --page=<slug>`, then again with `--w=390`: every control clicks without JS errors.
- `node qa/scrollshots.mjs website/<slug>/index.html <scratch>/<slug>-d 1440 900` and `... 390 844`.
- Then actually look at the screenshots and fix what looks off: spacing, contrast, cropping, empty states, broken pinning, text over busy video.
- Also check the reduced-motion view (`qa/shot.mjs` writes `-reduced`).

---

## A · "Lights On", slug `a-lights-on`

**Storyline.** Laxman Chowk, 5:30 am, the lights come on. The site is a walk into the building:
1. From the street, under the neon
2. Up through four floors
3. Onto the floor where tonight's sessions run
4. Meet the crew
5. Pick your pass
6. Back out into the night to find the lights

**Mood.** Cinematic, nocturnal, neon. It uses the gym's own purple light and hexagon ceiling lamps, with the logo's yellow as the "switch".

**Palette.**

| Token | Value |
|---|---|
| bg | `#07060B` |
| bg-2 | `#0E0C14` |
| surface | `#15121E` |
| line | `rgba(244,241,250,.09)` |
| ink | `#F4F1FA` |
| mute | `#A39CB4` |
| violet | `#8B46FF` |
| violet glow | `#B784FF` |
| yellow (CTAs, "switch on") | `#FBE421` |
| pink (rare neon accent) | `#FF3EA5` |

**Type.**
- **Archivo**, variable (wdth 62–125, wght 100–900): display, uppercase condensed heavy. Animate the width axis on reveal and hover.
- **Manrope**: body.
- **Martian Mono**: HUD labels, small uppercase, tracked.

**Signature interactions**
1. **Hexagon light-grid hero.**
   - A full-bleed `floor` video sits under a canvas of dark hexagon "lamps".
   - Cells around the cursor switch on and reveal the video brighter. On touch, it's a tap ripple plus an auto-sweep.
   - A "Lights 0→100%" HUD meter fills as you scroll the hero, until every lamp is on.
   - Headline: **LIGHTS ON.**
   - Sub: "Four floors of iron, spin and sweat in the heart of Dehradun — since 2009."
   - CTAs: Book a free trial (yellow) · Watch the film (modal).
   - HUD: live open/closed status (`FS.openStatus()`), "4.7★ Justdial", scroll cue.
2. **The Elevator** (pinned, scroll-driven).
   - **Left: the elevator panel.** Round lit buttons G/1/2/3, a 7-segment floor display and an animated ▲.
   - **Right: the doors.** Two panels close and reopen between floors to reveal each floor's video, name, one-liner, zone list and brand chips.
   - Buttons jump to a floor.
   - On mobile, there's no pin: stacked floor cards with a door-open reveal and a mini indicator.
   - Tag: floor order "Illustrative".
3. **"On the floor" live timetable.**
   - Mon–Sat day tabs, defaulting to today. On Sunday, show Monday with a "closed Sundays" note.
   - Rows read like a departure board: big mono time, class, kind, duration and intensity bars.
   - "LIVE NOW" (pink pulse) and "NEXT UP" (yellow) badges come from `FS.classesFor(day)`.
   - Filter chips by category.
   - Clicking a row opens booking prefilled with that class and time.
   - Tag "Illustrative".

**Other sections**
- **Neon manifesto** (scrubbed): "CONSISTENCY." "DISCIPLINE." then "LIFT. SWEAT. REPEAT." Each word flickers on like a neon tube. Behind it, the real signs (`coach-crunch`, `press-liftsweat`, `train-hard`) crossfade. End on "Fitness is not a punishment. It's a practice."
- **"Pick your session" rail:** tall 9:16 programme cards that play their loop on hover or in view (one at a time). Each shows an intensity meter. It is draggable and has a progress bar. Click opens a drawer with long copy and "Book this".
- **The Crew:** a huge condensed roster of names. Hovering a row floats a coaching photo after the cursor (generic photos). The director card carries his credentials ("To confirm") and quote.
- **Scoreboard:** neon counters (`FS.stats`) and rating chips. Transformations appear as "result plates". Reviews run as a two-row marquee (opposite directions, pause on hover). A "Member story" card opens `voice-senior` with sound.
- **Passes:** four plans as glowing passes, with a toggle for total, per month and per day. "Most popular" glows. Includes are tagged "Illustrative". The CTA opens booking with the plan.
- **Visit:** "Find the lights." The `night` video is the background. Address, open-now status and an hours table (today highlighted). Directions, Call, WhatsApp and Instagram, plus a dark-styled lazy map iframe.
- **Footer:** a big "LIGHTS ON." echo.

**Loader.** Seven hex lamps in the gym's ceiling-cluster pattern flicker on like tube lights while a clock ticks to 05:30:00. It lasts ≤ 2.2 s, once per session (sessionStorage).

**Nav.**
- Desktop: the yellow mark plus a white wordmark. Links: Floors · Sessions · Crew · Passes · Visit. An open-now dot and "Book a trial".
- Mobile: a full-screen menu with giant condensed links.

---

## B · "The Academy", slug `b-academy`

**Storyline.** Their tagline, taken literally. Fitness Solutions is "A Complete Fitness Academy", so the website is its prospectus for 2026–27. The chapters:
- I. Principal's note
- II. A short history
- III. The Curriculum
- IV. The Faculty
- V. The Campus
- VI. Alumni
- VII. Fees
- VIII. Apply
- IX. Visiting

It positions the club as Dehradun's established, teaching-first institution against the flashy new chains. The tone is calm and credible, but alive: paper, ink, rubber stamps, page-turns.

**Palette.**

| Token | Value |
|---|---|
| paper | `#F3EDE1` |
| paper-2 | `#EAE2D1` |
| card | `#FBF8F1` |
| ink | `#17140F` |
| ink-2 | `#4B4438` |
| mute | `#7A7262` |
| rule | `#D3C8B2` |
| yellow (highlighter) | `#F2CF2E` |
| red (stamp, seal) | `#B8321D` |
| green (Doon forest; ticks, links) | `#1F4A3A` |
| dark sections | ink bg with paper text |

**Type.**
- **Newsreader**, variable (opsz, wght 200–800, italic): display and reading.
- **Instrument Sans**: UI.
- **Graduate**: collegiate labels, crest text and chapter numerals.
- Hindi: **Tiro Devanagari Hindi** for display and **Noto Sans Devanagari** for UI.

**Signature interactions**
1. **Admission form → live Admit Card.**
   - **Fields:** name, phone, age group, programme (from the curriculum), batch (Morning, Evening or Women's), start date (chips for the next 6 open days).
   - **The card** looks like an ID card and updates as you type. It shows the crest, "ADMIT CARD · FREE TRIAL SESSION", name, course code, batch, date, an admission no. `FS/26/####` (hash of name), an initials photo box and barcode stripes generated from the name.
   - **On submit,** a red "ADMITTED" stamp slams on.
   - **Actions:** Print / Save as PDF (`window.print` with a print stylesheet showing only the card) · Send on WhatsApp · Add to calendar.
2. **The Curriculum: a course catalogue.**
   - Courses: FS 001 InBody Assessment (a prerequisite for all) · FS 101 Strength Foundations · FS 110 Personal Training · FS 120 BODYPUMP · FS 130 Spinning · FS 140 Bhangra Fitness · FS 150 Step Aerobics · FS 160 HIIT · FS 170 Functional & Mobility · FS 180 Zumba · FS 190 Women's Batches.
   - Filters by goal (Lose fat / Get stronger / Move better / Enjoy it) and format (Class / 1:1 / Open floor).
   - Each row shows code, title, format, "credits" (suggested sessions per week), intensity dots and prerequisite.
   - Rows expand to a syllabus with a 4-week outline (Illustrative). "Enrol" preselects the course in Apply.
3. **Yearbook history** (pinned horizontal scroll).
   - `FS.timeline` chapters as scrapbook pages with taped photos and captions. Pages turn (a slight rotateY) as you scroll. Shows "Chapter n of 5".
   - Plus a site-wide **EN / हिं toggle** that switches the nav, chapter titles, headings and buttons (glossary below).

**Other sections**
- **Masthead hero:**
  - A cover strip: "Prospectus 2026–27 · Vol. XVII · Laxman Chowk, Dehradun".
  - Huge serif "Admissions are open." with an italic line, "Seventeen years of teaching Dehradun to train."
  - An arched window holding a portrait video loop.
  - A rotating crest seal (SVG text on a circle: "FITNESS SOLUTIONS · A COMPLETE FITNESS ACADEMY · EST. 2009 · DEHRADUN ·") that overlaps the arch and rotates on scroll.
  - CTAs: Apply for admission · Book a campus tour (modal).
- **Principal's note:** a letter adapted from the client's own copy, with the director's signature in italic. Tag "Illustrative".
- **Fact column:** 17 years · 4 floors · 80+ stations · 9 faculty.
- **Faculty:** cream index cards with ruled lines, a Graduate monogram, name and role. The cards sit slightly rotated and straighten on hover. The director's card is larger, with credentials ("To confirm") and his quote.
- **Campus:** an architectural section drawing (SVG line art) of a four-storey building. Clicking a floor shows its photo with an italic caption and its zones. Floor order "Illustrative". Below it, a captioned photo-essay strip that opens a lightbox.
- **Alumni:**
  - Transformations as "report cards" (big serif numerals, a red "RESULT" stamp).
  - Reviews as letters with their sources.
  - An "Alumni voices" arched video (`voice-senior`, plays with sound).
- **Fees:** "Fee structure 2026–27" table with columns for duration, fee, per month and per day. The most popular plan is circled by a hand-drawn red SVG stroke that draws in. Includes are tagged "Illustrative". Footnote: "GST as applicable; personal training priced separately (to confirm)".
- **Visiting:**
  - A library-card address card, an hours table and a sepia map.
  - Directions, Call and WhatsApp.
  - FAQ accordion.
- **Colophon footer.**

**Loader.** The crest seal stamps onto the paper (scale and rotate, ink spread), then the page lifts.

**Nav.**
- Desktop: the crest mark plus wordmark in ink. Links: History · Curriculum · Faculty · Campus · Fees. The EN/हिं toggle and an "Apply" button.
- Desktop also gets a sticky side "Contents" index that highlights the current chapter.
- Mobile: a contents-page overlay.

**Hindi glossary**

| English | Hindi |
|---|---|
| Admissions are open. | प्रवेश शुरू हैं। |
| Seventeen years of teaching Dehradun to train. | सत्रह वर्षों से देहरादून को ट्रेनिंग सिखाते हुए। |
| A Complete Fitness Academy | एक संपूर्ण फ़िटनेस अकादमी |
| Apply for admission | प्रवेश के लिए आवेदन करें |
| Book a campus tour | कैंपस टूर बुक करें |
| Principal's note | निदेशक का संदेश |
| A short history | संक्षिप्त इतिहास |
| The Curriculum | पाठ्यक्रम |
| The Faculty | हमारे प्रशिक्षक |
| The Campus | कैंपस |
| Alumni | हमारे सदस्य |
| Fees | शुल्क |
| Apply | आवेदन |
| Visiting | हमसे मिलें |
| Enrol | नामांकन करें |
| Most popular | सबसे लोकप्रिय |
| per month / per day | प्रति माह / प्रति दिन |
| Monthly / 3 Months / 6 Months / Annual | मासिक / 3 महीने / 6 महीने / वार्षिक |
| Admit card | प्रवेश पत्र |
| Admitted | प्रवेश स्वीकृत |
| Fitness is not a punishment. It's a practice. | फ़िटनेस सज़ा नहीं, एक अभ्यास है। |
| Open now | अभी खुला है |
| Directions / Call | रास्ता देखें / कॉल करें |
| Name / Phone / Programme / Batch | नाम / फ़ोन / कार्यक्रम / बैच |
| Morning / Evening / Women's batch | सुबह / शाम / महिला बैच |
| Start date | शुरुआत की तारीख |
| Frequently asked questions | अक्सर पूछे जाने वाले सवाल |

---

## C · "Fitness, Solved.", slug `c-solutions`

**Storyline.** The name, taken literally. Everyone walks in with a problem: "the weight crept on", "my back hurts at my desk", "I'm 60 and want to stay strong". Fitness Solutions solves it in four steps:
1. **Diagnose:** InBody plus a conversation.
2. **Prescribe:** plan, classes and coach.
3. **Train:** four floors.
4. **Prove:** re-measure.

The site behaves like a smart, honest consultation: interactive and numbers-first. "No random workouts. No copy-pasted routines."

**Mood.** Bright, clean and kinetic. Bento grids, live numbers, springy micro-interactions. Logo yellow marks "the solution"; violet (their interior light) is the data colour.

**Palette.**

| Token | Value |
|---|---|
| bg | `#F2F3EF` |
| card | `#FFFFFF` |
| ink | `#0E0F13` |
| ink-2 | `#4C505A` |
| mute | `#8A8E98` |
| line | `rgba(14,15,19,.10)` |
| yellow | `#FFE21A` |
| violet | `#6B3CF6` |
| green | `#12A150` |
| coral | `#FF5A36` |
| dark blocks | `#0E0F13` |

**Type.**
- **Bricolage Grotesque**, variable (opsz, wdth, wght): display.
- **Geist**: body.
- **Geist Mono**: numbers and labels.

**Signature interactions**
1. **The Solution Engine (hero).**
   - **A live sentence builder** of inline, accessible chip popovers: "I want to [lose fat ▾]. I can train [4 ▾] days a week, in the [evenings ▾]. I'm [new to the gym ▾]."
   - **Goals:** lose fat · build muscle · get stronger · move without pain · boost stamina · stay strong at 50+ · sports performance.
   - **The "Solution card" updates instantly.** It shows:
     - A programme title
     - A Mon–Sat plan strip colour-coded by session type
     - Matching classes from `FS.classesFor`, filtered by time preference
     - The coaching model (1:1 or group-coached)
     - Floor badges
     - A recommended plan and price
     - An illustrative 12-week projection micro-chart, with the disclaimer "Illustrative — your InBody scan sets the real numbers"
   - **A portrait video tile swaps per goal:** lose→`ropes`, strong→`floor`, muscle→`dumbbells`, stamina→`spin`, mobility→`functional`, 50+→the `member-senior` photo, sport→`functional`.
   - **CTA:** "Book my free assessment", prefilled with the solution.
2. **Know your numbers.**
   - **Inputs:** sex, age, height, weight and activity.
   - **BMI** uses the **Asian cut-offs** (<18.5 / 18.5–22.9 / 23–24.9 / ≥25) on a coloured scale with a marker.
   - **Calories:**
     - BMR via Mifflin–St Jeor
     - Maintenance = BMR × activity factor
     - Goal calories: −400 for fat loss, +250 for muscle
   - **Daily targets:** protein 1.6 g/kg; water 35 ml/kg.
   - Numbers tween and ring gauges animate.
   - Note: "Estimates — an InBody scan at the front desk measures muscle and fat properly."
3. **The Building: an isometric explorer.**
   - Four stacked CSS-3D floor slabs carry photo textures and labels, and separate on enter.
   - Hover or tap raises a slab and shows a details panel: video loop, zones and "what you'll solve here" chips.
   - On mobile it becomes a 2D accordion.
   - Floor order "Illustrative".

**Other sections**
- **Proof ticker:** 17 yrs · 4 floors · 80+ stations · 4.7★ Justdial (300+) · 4.8★ FITPASS (48) · 3.2K on Instagram (to confirm).
- **The Method:** an animated circular loop diagram (Diagnose → Prescribe → Train → Prove) with a moving dot driven by scroll. Its cards reuse the client's approach copy (Know the person / Train with intent / Stay for the change).
- **Programmes:** a filterable bento grid with a video on hover, an intensity meter and "best for" tags. A card opens a detail sheet.
- **Quiet hours:** an illustrative week × hour busy-ness heatmap plus the selected day's classes.
- **Plan calculator:**
  - A duration segmented control (1/3/6/12) and add-on toggles (personal training "on request", extra InBody scans, tagged "Illustrative").
  - Shows the total, effective per-month and per-day cost, and savings versus paying monthly. For example, annual is ₹18,000 against ₹42,000 for twelve monthly payments, a saving of ₹24,000.
  - A bar comparison of the four plans.
  - "Lock this plan" opens booking.
- **Results:** a diverging bar chart of kg changes (Saloni −40, Gurkirat +16, Durga +10) plus cards for the qualitative ones. Ratings cards, review cards, and a "Member story" video modal.
- **Coaches:** a compact monogram grid. The director card carries his credentials ("To confirm").
- **FAQ:** an instant search filter with an "Ask on WhatsApp" fallback.
- **Book:**
  - Pick a date (the next 7 open days) and a 30-minute slot. Some slots show as "booked", generated deterministically from a hash of the date.
  - Enter name and phone.
  - The confirmation ticket has a generated QR-like pattern, WhatsApp and ICS.
  - Map, address and hours.

**Loader.** An InBody-style scan line sweeps over the logo mark while a mono readout runs "calibrating… ready". It lasts ≤ 1.8 s, once per session.

**Nav.**
- Desktop: the mark plus wordmark. Links: Solutions · Method · Numbers · Building · Plans · Book. A yellow "Free assessment" pill.
- Mobile: a bottom quick bar (Book · WhatsApp · Call).
