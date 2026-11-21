# IKIGAI Fitness Club: the three directions

All three render from `mockups/shared/data.js` (`window.IK`) and share the same media. Each keeps the interactions of the template it was built from, and re-tells them through the four circles of ikigai. Japanese appears only as accents beside the English.

## A · Akari (灯, "the lights come on") — `website/a-akari/`
Cinematic and nocturnal: black, washi white, one ember glow and the club's hexagon texture.

| Section | What it does |
|---|---|
| Loader | Hexagon cells light up as the clock reaches 06:00, opening time |
| Hero 始め | The club's own floor photo goes dark, then the wall slogan, ceiling strips, plates and turf light up one by one. "Find your Ikigai." CTAs: free trial · WhatsApp |
| 01 Manifesto | The wall slogan lit word by word: "This place / will change you, / if you / let / it." Photos: the four-circle door sign, the floor, the boxing mural |
| 02 Four circles 生き甲斐 | A lift ride through Joy 喜, Power 力, Tribe 仲間 and Restore 癒し, each with a clip, zones and look-around stills |
| 03 Seven ways in 道 | Programme rail (Yoga is a type-only card until there are photos) |
| 04 Now & next 時 | Live timetable (sample data) with kanji weekdays |
| 05 Boxing Club 拳 | The club inside the gym: mural clip, sign, heavy bag |
| 06 Coaches 先生 | Coach Arun plus role cards with no invented names |
| 07 Kaizen 改善 | Counters, ratings, four review-theme plates (paraphrased), reels |
| 08 Plans 約束 | Unknown prices show "Call for price"; the 12-month plan is "Best value" |
| 09 Visit 訪 | Schematic map of Rajpur Road and Doon Zone Tower, hours, way in |

## B · The Dojo (道場) — `website/b-dojo/`
Editorial: a dojo handbook on washi paper, a hanko seal reading 生き甲斐, and red-pencil margin notes. EN / हिन्दी toggle.

Chapters: I 入門 a letter to the new member · II 一日 a day at Ikigai, 06:00 to 21:30 · III 道 seven ways in (course catalogue with four-week syllabi) · IV 先生 coaches · V 生き甲斐 a clickable ikigai diagram laid out like the real one (love faces "what you need", good-at faces world-needs) · VI 改善 review-theme cards and the community notice board · VII 約束 plans table · VIII 入門 a trial pass that fills in as you type, then gets stamped 歓迎 · IX 訪 visiting.

## C · Find your Ikigai (生き甲斐) — `website/c-ikigai/`
Bright and interactive.

| Section | What it does |
|---|---|
| Hero | "I want to [lose fat / learn to box / dance & have fun / find my people…]" builds your circle, your week (kanji weekdays), coaching, a plan and a projection |
| 01 Kaizen | The loop: 聴 listen, 計 plan, 練 train, 改 improve |
| 02 Numbers | BMI (Asian cut-offs), calories, protein, water |
| 03 Four circles | Isometric stack of Joy, Power, Tribe and Restore, with clips and stills |
| 04 Seven ways in | Bento of programmes (spans chosen so the grid closes at 2–5 columns) |
| 05 Quiet hours | Sample busy-ness heatmap, 6 am to 10 pm |
| 06 Plans | Calculator that handles unknown prices, with a boxing interest toggle |
| 07 Kaizen | Review themes, ratings, notice board, reels |
| 08–10 | Coaches, FAQ search, booking ticket, map |

## Media map
Built by `tools/media/build_ikigai.sh` from the client's media folder. Every image is the club's own.

| Key | Source |
|---|---|
| boxing-mural, dumbbells, exterior, functional, gym-floor, ikigai-sign, plate-machine, power-rack, punchbag | Enhanced portraits (+ 16:9 panoramas in `img/hero`) |
| slogan-floor | WhatsApp photo of the floor under the wall slogan |
| boxing-sign, air-bikes, steam-room, washroom | Tiles cut from the facilities poster (small: ~420 px) |
| zumba-class, zumba-smile, dance-class, dance-crew, treadmills, airbike-rider, trek-bridge, trek-river, runner | Frames from the club's videos |
| Clips: zumba, dance, airbike, treadmills, trek, film (reel, sound), day (Zumba, sound) | The club's videos |
| Clips: boxing, floor, rack, bag, sign, restore | Slow push-ins on stills, for spaces with no footage yet |

Gaps: no usable photos of yoga, the cafeteria, the team or transformations, and the steam room and washrooms exist only as small poster crops.
