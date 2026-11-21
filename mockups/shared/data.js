/* IKIGAI Fitness Club — shared content for all three design directions.
   Single source of truth: every direction renders from window.IK.
   `confirm: true` marks facts found in public sources that the club still has to confirm;
   `sample: true` marks illustrative content written for the mockup. Both render with a small tag.
   Rule: no invented prices, trainer names, reviews or timetables are presented as real. */
(() => {
  // Resolve asset paths relative to this file, so pages at any depth can use IK.img("…").
  const SELF = document.currentScript && document.currentScript.src;
  const BASE = SELF ? SELF.replace(/data\.js(\?.*)?$/, "") : "../../shared/";

  const IK = {
    base: BASE,
    img: (k, sm) => `${BASE}img/${k}${sm ? "-sm" : ""}.jpg`,
    // Every clip has a 16:9 "wide" version: the portrait footage centred over a blurred copy of itself.
    vid: (k, wide) => (k ? `${BASE}video/${k}${wide ? "-wide" : ""}.mp4` : ""),
    poster: (k, wide) => (k ? `${BASE}video/${k}${wide ? "-wide" : ""}.jpg` : ""),
    brandAsset: (f) => `${BASE}brand/${f}`,
    // Hero-grade media. The club's footage is phone video (~478x850), so the HQ helpers return the same files.
    // IK.imgXL(k): up to 2400px; IK.imgHero(k[, sm]): 16:9 cuts of the enhanced panoramas (3200x1800 / 1920x1080).
    vidHQ: (k, wide) => (k ? `${BASE}video/${k}${wide ? "-wide" : ""}.mp4` : ""),
    posterHQ: (k, wide) => (k ? `${BASE}video/${k}${wide ? "-wide" : ""}.jpg` : ""),
    imgXL: (k) => `${BASE}img/xl/${k}.jpg`,
    imgHero: (k, sm) => `${BASE}img/hero/${k}${sm ? "-sm" : ""}.jpg`,
    HQ_STILLS: ["boxing-mural", "dumbbells", "exterior", "functional", "gym-floor", "ikigai-sign", "plate-machine", "power-rack", "punchbag", "slogan-floor"],
    HERO_STILLS: ["boxing-mural", "dumbbells", "exterior", "functional", "gym-floor", "ikigai-sign", "plate-machine", "power-rack", "punchbag"],

    brand: {
      name: "IKIGAI Fitness Club",
      short: "Ikigai",
      boxing: "Ikigai Boxing Club",
      tagline: "Find your reason to move.",
      kanji: "生き甲斐",
      reading: "iki · life — gai · worth",
      meaning: "Ikigai (生き甲斐) is Japanese for “a reason for being”: iki means life and gai means worth.",
      since: null, // founding year not known yet — ask the client
      city: "Dehradun",
      state: "Uttarakhand",
      lines: {
        wall: "This place will change you, if you let it.", // painted on the gym wall
        main: "Find your reason to move.",
        rep: "Every rep has a reason.",
        worth: "Iki = life. Gai = worth. Train for a life worth living.",
        four: "Four circles. One reason. Yours.",
        find: "Find your Ikigai.",
        fusion: "Japanese soul, Doon energy.",
      },
    },

    // The ikigai diagram: four overlapping circles, one pillar of the club in each.
    circles: [
      { id: "joy", word: "Joy", kanji: "喜", romaji: "Yorokobi", ask: "What you love", color: "#FF8A3D",
        items: ["Zumba", "Bhangra", "Yoga"], line: "Music on, mirror wall full, nobody counting reps." },
      { id: "power", word: "Power", kanji: "力", romaji: "Chikara", ask: "What you're good at", color: "#FF5A1F",
        items: ["Strength", "Lifting", "Cardio", "Boxing"], line: "Racks, plates, air bikes and a boxing club of its own." },
      { id: "tribe", word: "Tribe", kanji: "仲間", romaji: "Nakama", ask: "What the world needs", color: "#F2EEE6",
        items: ["The Morning Grind", "Shikhar Falls treks", "Community"], line: "Coffee, music, treks: people who keep you coming back." },
      { id: "restore", word: "Restore", kanji: "癒し", romaji: "Iyashi", ask: "What you need", color: "#C9A36A",
        items: ["Steam", "Showers", "Lockers", "Cafeteria"], line: "Steam, hot showers and a cafeteria. Recovery is part of the workout." },
    ],

    // The 12 facilities on the club's own poster.
    facilities: ["Gym", "Yoga", "Zumba", "Boxing", "Bhangra", "Steam", "Showers", "Lifting", "Lockers", "Cafeteria", "Training", "Cardio"],
    amenities: ["Free WiFi", "Wheelchair-accessible entrance", "Unisex, women-friendly"],

    contact: {
      address: "138/345, First Floor, Doon Zone Tower",
      locality: "Jakhan, Rajpur Road",
      cityLine: "Dehradun, Uttarakhand 248001",
      phone: "+91 70173 85943",
      phoneHref: "tel:+917017385943",
      whatsapp: "+91 70173 85943",
      waNumber: "917017385943", // which number is on WhatsApp is to confirm
      waConfirm: true,
      otherPhones: ["+91 95206 65943", "+91 78189 14101"],
      email: "ikigaifitnessclub@gmail.com", emailConfirm: true,
      instagram: { handle: "@ikigaifitnessclub", url: "https://www.instagram.com/ikigaifitnessclub/", posts: "750+", confirm: true },
      facebook: { handle: "Ikigai Fitness CLUB", url: "https://www.facebook.com/search/top?q=" + encodeURIComponent("Ikigai Fitness Club Dehradun"), confirm: true },
      domain: "ikigaifitnessclub.com",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent("IKIGAI Fitness Club, Doon Zone Tower, Jakhan, Rajpur Road, Dehradun 248001"),
      mapsEmbed: "https://www.google.com/maps?q=" + encodeURIComponent("IKIGAI Fitness Club, Doon Zone Tower, Jakhan, Rajpur Road, Dehradun 248001") + "&z=16&output=embed",
      parking: "Free on-site parking", parkingConfirm: true,
    },

    // Mon–Sat 6 am – 10 pm from listings. Sunday is unknown, so it shows as closed until confirmed.
    hours: {
      confirm: true,
      label: "Mon – Sat · 6:00 am – 10:00 pm",
      sunday: "Sunday: to confirm",
      days: { 1: ["06:00", "22:00"], 2: ["06:00", "22:00"], 3: ["06:00", "22:00"], 4: ["06:00", "22:00"], 5: ["06:00", "22:00"], 6: ["06:00", "22:00"], 0: null },
    },

    stats: [
      { id: "facilities", value: 12, suffix: "", label: "facilities under one roof", note: "From the club's poster" },
      { id: "ways", value: 7, suffix: "", label: "ways to train" },
      { id: "reviews", value: 230, suffix: "+", label: "Google reviews · 4.8★", confirm: true },
      { id: "posts", value: 750, suffix: "+", label: "Instagram posts", confirm: true },
    ],

    ratings: [
      { source: "Google", score: 4.8, count: "230+", url: "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent("IKIGAI Fitness Club Jakhan Dehradun"), confirm: true },
      { source: "Justdial", score: 4.7, count: "162", url: "https://www.justdial.com/Dehradun/search?q=" + encodeURIComponent("Ikigai Fitness Club"), confirm: true },
    ],

    equipment: ["Power racks", "Plate-loaded machines", "Air bikes", "Treadmills", "Turf track", "Punch bags"],

    // Only Coach Arun is known (tagged on Instagram). The other cards are roles, not people: placeholder: true.
    team: [
      { name: "Coach Arun", role: "Coach", lead: true, confirm: true,
        creds: ["Tagged as a coach on the club's Instagram", "Speciality, certifications and photo to confirm"],
        quote: "This place will change you, if you let it.", quoteBy: "On the wall at Ikigai" },
      { name: "Boxing coach", role: "Ikigai Boxing Club", placeholder: true },
      { name: "Strength coach", role: "Gym floor", placeholder: true },
      { name: "Zumba & Bhangra", role: "Dance instructor", placeholder: true },
      { name: "Yoga", role: "Yoga instructor", placeholder: true },
      { name: "Front desk", role: "Memberships & trials", placeholder: true, desk: true },
    ],

    // Seven ways in. `img`/`video` keys refer to shared/img and shared/video; every one is the club's own media.
    // Yoga has no photo or footage yet (img: null) and renders as a type-only card.
    programs: [
      { id: "gym", name: "Gym Floor", jp: "力", kind: "Open floor", cat: "strength", circle: "power", intensity: 4, img: "plate-machine", video: "floor",
        short: "Power racks, plate-loaded machines, dumbbells and a turf track.",
        long: "The main floor, under the wall that reads “This place will change you, if you let it.” Racks, plate-loaded machines, dumbbells to heavy, and a turf lane for sled and carry work. Coaches walk the floor and fix your form." },
      { id: "cardio", name: "Cardio", jp: "息", kind: "Open floor", cat: "cardio", circle: "power", intensity: 3, img: "air-bikes", video: "treadmills",
        short: "Treadmills by the window and a row of air bikes.",
        long: "Warm up with a view: a line of treadmills along the windows, plus air bikes for intervals that leave nothing in the tank." },
      { id: "boxing", name: "Ikigai Boxing Club", jp: "拳", kind: "Club zone", cat: "combat", circle: "power", intensity: 5, img: "punchbag", video: "boxing", confirm: true,
        short: "A boxing club inside the gym, with its own zone, bags and mural.",
        long: "The club's own branded zone: heavy bags, the mural and room to move. Footwork, pad work and conditioning. Beginner-friendly batches, the coach and batch times are to confirm with the club." },
      { id: "zumba", name: "Zumba", jp: "喜", kind: "Group class", cat: "dance", circle: "joy", intensity: 3, img: "zumba-smile", video: "zumba",
        short: "The party with a workout hidden inside. Just another day at Ikigai.",
        long: "Easy-to-follow choreography in the mirrored studio. Come for the cardio, stay because it's the best hour of your day." },
      { id: "bhangra", name: "Bhangra", jp: "踊", kind: "Group class", cat: "dance", circle: "joy", intensity: 4, img: "dance-class", video: "dance",
        short: "Punjabi beats, big moves, serious cardio. Doon energy.",
        long: "A high-energy dance workout built on bhangra steps. Easy to learn and hard to stop smiling through. Photo and clip: a dance class in the Ikigai studio." },
      { id: "yoga", name: "Yoga", jp: "和", kind: "Group class", cat: "mind", circle: "joy", intensity: 2, img: null, video: null, confirm: true,
        short: "Breath, mobility and balance. The quiet circle.",
        long: "Yoga is on the club's facilities list. Batch times and the instructor are to confirm, and photos will follow from the next shoot." },
      { id: "pt", name: "Personal Training", jp: "師", kind: "1 : 1", cat: "strength", circle: "power", intensity: 3, img: "gym-floor", video: null,
        short: "One-to-one coaching built around your goal, your week and your pace.",
        long: "Every plan starts with a conversation: your history, old injuries, your real week. Then a programme that adapts as you do. PT prices are to confirm." },
    ],

    // Illustrative weekly timetable (the club has not published one). day: 1=Mon … 6=Sat
    timetable: {
      sample: true,
      slots: [
        { t: "06:30", d: 45, cls: "yoga", days: [1, 3, 5] },
        { t: "07:00", d: 45, cls: "boxing", days: [2, 4, 6] },
        { t: "07:30", d: 45, cls: "zumba", days: [1, 3, 5] },
        { t: "08:00", d: 45, cls: "bhangra", days: [6] },
        { t: "10:00", d: 60, cls: "gym", days: [1, 2, 3, 4, 5, 6] },
        { t: "17:30", d: 40, cls: "cardio", days: [1, 3, 5] },
        { t: "18:00", d: 45, cls: "zumba", days: [2, 4, 6] },
        { t: "18:30", d: 45, cls: "boxing", days: [1, 3, 5] },
        { t: "19:00", d: 45, cls: "bhangra", days: [2, 4] },
        { t: "19:30", d: 45, cls: "yoga", days: [2, 4] },
        { t: "20:00", d: 45, cls: "boxing", days: [2, 4] },
      ],
    },

    // The four circles, as places to explore (the club is one floor of Doon Zone Tower; these are its four worlds).
    // img = main still, alt = second still, video = loop, more = extra stills (for "look around" galleries).
    floors: [
      { n: "1", id: "joy", kanji: "喜", romaji: "Yorokobi", name: "Joy", ask: "What you love", img: "zumba-class", alt: "dance-crew", video: "zumba", more: ["dance-class", "zumba-smile", "dance-crew"],
        zones: ["Zumba", "Bhangra", "Yoga", "Mirrored studio, wooden floor"],
        line: "The music's on and the mirror wall is full. Nobody's counting reps." },
      { n: "2", id: "power", kanji: "力", romaji: "Chikara", name: "Power", ask: "What you're good at", img: "power-rack", alt: "plate-machine", video: "floor", more: ["power-rack", "plate-machine", "dumbbells", "treadmills"],
        zones: ["Power racks & plate-loaded machines", "Dumbbells & turf track", "Treadmills & air bikes", "The Ikigai Boxing Club"],
        line: "Under the wall that says it plainly: this place will change you, if you let it." },
      { n: "3", id: "tribe", kanji: "仲間", romaji: "Nakama", name: "Tribe", ask: "What the world needs", img: "trek-river", alt: "dance-crew", video: "trek", more: ["trek-river", "dance-class", "exterior"], confirm: true,
        zones: ["The Morning Grind: coffee & music", "Shikhar Falls treks", "Group classes", "A good crowd"],
        line: "Train together, then take it outside: river beds, trails, the hills above Rajpur Road." },
      { n: "4", id: "restore", kanji: "癒し", romaji: "Iyashi", name: "Restore", ask: "What you need", img: "steam-room", alt: "washroom", video: "restore", more: ["steam-room", "washroom"],
        zones: ["Steam room", "Premium washrooms & showers", "Lockers", "Cafeteria"],
        line: "Steam, hot showers and a cafeteria. Recovery is part of the workout." },
    ],

    // Prices seen in the club's promo reels (possibly offers). Unknown prices are null and render as "Call for price".
    plans: [
      { id: "m1", name: "Monthly", jp: "壱", months: 1, price: null, line: "Start your routine" },
      { id: "m3", name: "3 Months", jp: "参", months: 3, price: null, line: "Build the habit" },
      { id: "m6", name: "6 Months", jp: "六", months: 6, price: 8000, confirm: true, line: "Make it part of your life" },
      { id: "m12", name: "12 Months", jp: "十二", months: 12, price: 12000, confirm: true, line: "A year worth living", popular: true },
    ],
    planIncludes: { sample: true, items: ["Gym floor & cardio", "Group classes", "Ikigai Boxing Club zone", "Steam room & showers", "Lockers"] },

    // No member results are published yet. These are slots to fill once members consent.
    transformations: [
      { name: "Member story", result: "With consent", kind: "slot" },
      { name: "Member story", result: "With consent", kind: "slot" },
      { name: "Member story", result: "With consent", kind: "slot" },
    ],

    // What reviewers praise, paraphrased (not quotes) from Google and Justdial reviews.
    reviews: [
      { theme: "Trainers", kanji: "師", text: "Friendly, qualified trainers who actually watch your form.", who: "Trainers", where: "Paraphrased from Google reviews", paraphrase: true },
      { theme: "Hygiene", kanji: "清", text: "Clean, hygienic and well kept, including the washrooms.", who: "Hygiene", where: "Paraphrased from Google reviews", paraphrase: true },
      { theme: "Equipment", kanji: "器", text: "Modern equipment in good condition, with room to train.", who: "Equipment", where: "Paraphrased from Google reviews", paraphrase: true },
      { theme: "Value", kanji: "価", text: "Affordable for the quality, with a good crowd.", who: "Value & vibe", where: "Paraphrased from Google & Justdial reviews", paraphrase: true },
    ],

    // A day at Ikigai, as five chapters (times are illustrative).
    timeline: [
      { year: "06:00", jp: "始め", title: "Hajime · Doors open", copy: "Early lifters, treadmills by the window, and on Morning Grind days, coffee and music.", sample: true },
      { year: "07:00", jp: "力", title: "Chikara · Power hour", copy: "Racks and plate-loaded machines fill up. The wall reads: this place will change you, if you let it.", sample: true },
      { year: "18:00", jp: "喜", title: "Yorokobi · The studio wakes up", copy: "Zumba and Bhangra in the mirrored studio. Just another day at Ikigai.", sample: true },
      { year: "20:00", jp: "拳", title: "Ken · The boxing club", copy: "Bags, footwork and pad work in the Ikigai Boxing Club zone.", sample: true },
      { year: "21:30", jp: "癒し", title: "Iyashi · Restore", copy: "Steam, a hot shower and a cafeteria stop before home.", sample: true },
    ],

    events: [
      { id: "grind", name: "The Morning Grind", jp: "朝", kind: "Coffee & music sessions", img: "dance-crew", confirm: true,
        copy: "Coffee, music and a workout to start the day together. Next date: ask the desk." },
      { id: "treks", name: "Shikhar Falls treks", jp: "山", kind: "Community trek", img: "trek-bridge", confirm: true,
        copy: "Members take the training outside, to the trails and the river beds above Rajpur Road." },
    ],

    faqs: {
      confirm: true,
      items: [
        { q: "What are your timings?", a: "Monday to Saturday, 6:00 am to 10:00 pm. Sunday timings are being confirmed, so please call ahead." },
        { q: "Can I try before I join?", a: "Yes. Book a free trial and we'll show you around the floor, the boxing club and the studio. Your first day is on us.", sample: true },
        { q: "Is it women-friendly? Are there women-only batches?", a: "Ikigai is a unisex, women-friendly gym. Ask us on WhatsApp about women-only batch timings." },
        { q: "Is there parking?", a: "Yes, there's free on-site parking at Doon Zone Tower." },
        { q: "What should I bring?", a: "Clean indoor shoes, a towel and a water bottle. There are lockers, showers and a steam room, so bring a change of clothes." },
        { q: "Do I need boxing experience?", a: "No. The Ikigai Boxing Club zone is for beginners too. Ask about beginner batches." },
        { q: "How much is personal training?", a: "It depends on how often you train. Message us on WhatsApp and we'll share the options." },
      ],
    },

    credits: [], // no stock photos: every image is the club's own

    goals: [
      { id: "lose", label: "Lose fat", circle: "power" },
      { id: "strong", label: "Get stronger", circle: "power" },
      { id: "box", label: "Learn boxing", circle: "power" },
      { id: "dance", label: "Dance & have fun", circle: "joy" },
      { id: "calm", label: "Yoga & mobility", circle: "joy" },
      { id: "pt", label: "Personal training", circle: "power" },
    ],

    jp: { // small Japanese accents used across the directions (always shown with the English)
      days: ["日", "月", "火", "水", "木", "金", "土"],
      nums: ["〇", "一", "二", "三", "四", "五", "六", "七", "八", "九", "十"],
      formal: ["壱", "弐", "参", "四", "五", "六"], // formal numerals: read as kanji, not as dashes
    },
  };

  /* ---------- helpers ---------- */
  IK.money = (n) => (n == null || Number.isNaN(n) ? "Call for price" : "₹" + Math.round(n).toLocaleString("en-IN"));
  IK.perDay = (p) => (p.price == null ? null : Math.round(p.price / (p.months * 30.4)));
  IK.perMonth = (p) => (p.price == null ? null : Math.round(p.price / p.months));
  IK.program = (id) => IK.programs.find((p) => p.id === id);
  IK.circle = (id) => IK.circles.find((c) => c.id === id);
  IK.wa = (text) => `https://wa.me/${IK.contact.waNumber}?text=${encodeURIComponent(text || "Hi Ikigai! I'd like to know more about membership.")}`;
  IK.initials = (name) => name.split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  // Dehradun time (IST) regardless of the viewer's timezone.
  IK.nowIST = () => {
    const d = new Date(Date.now() + (new Date().getTimezoneOffset() + 330) * 60000);
    return { day: d.getDay(), mins: d.getHours() * 60 + d.getMinutes(), date: d };
  };
  IK.toMins = (hhmm) => { const [h, m] = hhmm.split(":").map(Number); return h * 60 + m; };
  IK.fmtTime = (hhmm) => { let [h, m] = hhmm.split(":").map(Number); const ap = h >= 12 ? "pm" : "am"; h = h % 12 || 12; return `${h}:${String(m).padStart(2, "0")} ${ap}`; };
  IK.openStatus = () => {
    const { day, mins } = IK.nowIST();
    const today = IK.hours.days[day];
    if (today) {
      const o = IK.toMins(today[0]), c = IK.toMins(today[1]);
      if (mins >= o && mins < c) return { open: true, text: `Open now · until ${IK.fmtTime(today[1])}` };
      if (mins < o) return { open: false, text: `Opens today at ${IK.fmtTime(today[0])}` };
    }
    for (let i = 1; i <= 7; i++) {
      const d = (day + i) % 7, h = IK.hours.days[d];
      if (h) return { open: false, text: `Closed now · opens ${i === 1 ? "tomorrow" : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d]} ${IK.fmtTime(h[0])}` };
    }
    return { open: false, text: "Closed" };
  };
  // Classes for a weekday (1–6), sorted, with live/next flags when it is today.
  IK.classesFor = (day) => {
    const { day: today, mins } = IK.nowIST();
    const list = IK.timetable.slots.filter((s) => s.days.includes(day)).sort((a, b) => IK.toMins(a.t) - IK.toMins(b.t))
      .map((s) => ({ ...s, program: IK.program(s.cls), start: IK.toMins(s.t), end: IK.toMins(s.t) + s.d }));
    if (day === today) {
      const live = list.find((s) => mins >= s.start && mins < s.end);
      const next = list.find((s) => s.start > mins);
      if (live) live.live = true;
      if (next) next.next = true;
    }
    return list;
  };

  // A real, downloadable calendar invite for a booked visit (frontend only).
  IK.ics = ({ title, start, minutes = 60, details = "" }) => {
    const pad = (n) => String(n).padStart(2, "0");
    const fmt = (d) => `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;
    const end = new Date(start.getTime() + minutes * 60000);
    const loc = `${IK.contact.address}, ${IK.contact.locality}, ${IK.contact.cityLine}`.replace(/,/g, "\\,");
    const body = [
      "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//IKIGAI Fitness Club//Mockup//EN", "BEGIN:VEVENT",
      `UID:${Date.now()}@ikigaifitnessclub.com`, `DTSTAMP:${fmt(new Date())}`, `DTSTART:${fmt(start)}`, `DTEND:${fmt(end)}`,
      `SUMMARY:${title.replace(/,/g, "\\,")}`, `LOCATION:${loc}`, `DESCRIPTION:${details.replace(/\n/g, "\\n").replace(/,/g, "\\,")}`,
      "END:VEVENT", "END:VCALENDAR",
    ].join("\r\n");
    const url = URL.createObjectURL(new Blob([body], { type: "text/calendar" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: "ikigai-free-trial.ics" });
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };

  // Build an IST Date for "day offset from today" + "HH:MM".
  IK.istDate = (offsetDays, hhmm) => {
    const { date } = IK.nowIST();
    const [h, m] = hhmm.split(":").map(Number);
    const y = date.getFullYear(), mo = date.getMonth(), d = date.getDate() + offsetDays;
    return new Date(Date.UTC(y, mo, d, h, m) - 330 * 60000); // IST → UTC
  };

  window.IK = IK;
})();
