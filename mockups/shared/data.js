/* Fitness Solutions — shared content for all three design directions.
   Single source of truth: every direction renders from window.FS.
   `confirm: true` marks facts we found but could not verify (sources disagree or are old);
   `sample: true` marks illustrative content written for the mockup. Both render with a small tag. */
(() => {
  // Resolve asset paths relative to this file, so pages at any depth can use FS.img("…").
  const SELF = document.currentScript && document.currentScript.src;
  const BASE = SELF ? SELF.replace(/data\.js(\?.*)?$/, "") : "../../shared/";

  const SINCE = 2009;
  const YEAR = new Date().getFullYear();

  const FS = {
    base: BASE,
    img: (k, sm) => `${BASE}img/${k}${sm ? "-sm" : ""}.jpg`,
    // Clips with a 16:9 crop: floor dumbbells night spin reception functional rack ropes sign cardio studio.
    vid: (k, wide) => (k ? `${BASE}video/${k}${wide ? "-wide" : ""}.mp4` : ""),
    poster: (k, wide) => (k ? `${BASE}video/${k}${wide ? "-wide" : ""}.jpg` : ""),
    brandAsset: (f) => `${BASE}brand/${f}`,

    /* Hero-grade media (16 Nov 2026), for first screens and any frame wider than ~900px:
       - FS.vidHQ(k[, wide]) / FS.posterHQ(k[, wide]): the camera's native 1080x1920 at high quality (CRF 19);
         wide = a native 1080x608 16:9 crop (no upscaling). Same keys as FS.vid. Wide crops exist for:
         floor dumbbells night spin reception functional rack ropes sign cardio studio.
       - FS.imgXL(k): 2400px long edge; FS.imgHero(k[, sm]): 16:9 crop, 3200x1800 (sm = 1920x1080).
         Both exist only for the 20 stills shot on the 24 MP camera (FS.HQ_STILLS). */
    vidHQ: (k, wide) => (k ? `${BASE}video/hq/${k}${wide ? "-wide" : ""}.mp4` : ""),
    posterHQ: (k, wide) => (k ? `${BASE}video/hq/${k}${wide ? "-wide" : ""}.jpg` : ""),
    imgXL: (k) => `${BASE}img/xl/${k}.jpg`,
    imgHero: (k, sm) => `${BASE}img/hero/${k}${sm ? "-sm" : ""}.jpg`,
    HQ_STILLS: ["press-hex", "press-hex-2", "press-liftsweat", "curl-woman", "cable-beige", "coach-rope", "coach-rope-2", "lateral-raise",
      "lunge-step", "coach-crunch", "coach-seated", "cable-tank", "logo-cardio", "ellipticals", "treadmills", "bag-red", "bag-tall",
      "turf-coach", "turf-wide", "turf-wide-2"],

    brand: {
      name: "Fitness Solutions",
      tagline: "A Complete Fitness Academy",
      since: SINCE,
      years: YEAR - SINCE, // 17 in 2026 (the current site says "18+", which doesn't add up — flag to client)
      city: "Dehradun",
      state: "Uttarakhand",
      director: "Shobhit Mittal",
      // The client's own lines from the current site — worth keeping.
      lines: {
        practice: "Fitness is not a punishment. It's a practice.",
        noRandom: "No random workouts. No copy-pasted routines.",
        firstTreadmill: "The first treadmill in the city belonged to us.",
        comeBack: "They leave. They come back.",
        heroSite: "Train. Get Stronger. Live Better.",
      },
      neon: ["LIFT", "SWEAT", "REPEAT", "CONSISTENCY", "DISCIPLINE", "TRAIN HARD"], // signs on their walls
    },

    contact: {
      address: "Plot No. 6, Malviya Road, Laxman Chowk",
      locality: "Indresh Nagar, near Saharanpur Road",
      cityLine: "Dehradun, Uttarakhand 248001",
      phone: "+91 99172 82333",
      phoneHref: "tel:+919917282333",
      whatsapp: "+91 74678 28233",
      waNumber: "917467828233",
      email: "shobhit.fitnesssolutions@gmail.com",
      instagram: { handle: "@fit_nesssolutions", url: "https://www.instagram.com/fit_nesssolutions/", followers: "3.2K", confirm: true },
      facebook: { handle: "doonfitnesssolutions", url: "https://www.facebook.com/doonfitnesssolutions/" },
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent("Fitness Solutions, Malviya Road, Laxman Chowk, Dehradun 248001"),
      mapsEmbed: "https://www.google.com/maps?q=" + encodeURIComponent("Fitness Solutions, Plot No. 6, Malviya Road, Laxman Chowk, Dehradun 248001") + "&z=16&output=embed",
      parking: "Ample parking",
    },

    // Sources disagree (05:00–06:00 open, 21:30–22:30 close, Sunday closed). Best reading below, flagged.
    hours: {
      confirm: true,
      label: "Mon – Sat · 5:30 am – 10:00 pm",
      sunday: "Sunday closed",
      days: { 1: ["05:30", "22:00"], 2: ["05:30", "22:00"], 3: ["05:30", "22:00"], 4: ["05:30", "22:00"], 5: ["05:30", "22:00"], 6: ["05:30", "22:00"], 0: null },
    },

    stats: [
      { id: "years", value: YEAR - SINCE, suffix: "", label: "years in Dehradun", note: `Since ${SINCE}` },
      { id: "floors", value: 4, suffix: "", label: "floors of training space" },
      { id: "stations", value: 80, suffix: "+", label: "workout stations" },
      { id: "coaches", value: 9, suffix: "", label: "coaches & staff" },
    ],

    ratings: [
      { source: "Justdial", score: 4.7, count: "300+", url: "https://www.justdial.com/Dehradun/Fitness-Centres/nct-10208976", confirm: true },
      { source: "FITPASS", score: 4.8, count: "48", url: "https://fitpass.co.in/studio/fitness-solutions-laxman-chowk" },
    ],

    equipment: ["Matrix", "Hoist", "Life Fitness", "Star Trac"],

    team: [
      {
        name: "Shobhit Mittal", role: "Director", lead: true,
        creds: ["B.P.Ed — sports performance & sports medicine", "Les Mills BODYPUMP™ instructor", "Reebok-certified CrossFit trainer", "International Spinning® instructor", "BOSU®, kettlebell & TRX® certified", "Sports nutritionist"],
        credsConfirm: true, // from the club's 2017 profile — re-confirm before launch
        quote: "Healthy mind resides in a healthy body.",
      },
      { name: "Apurva", role: "Manager" },
      { name: "Satpal", role: "Head Trainer" },
      { name: "Vansh", role: "Trainer" },
      { name: "Ajay", role: "Trainer" },
      { name: "Siddharth", role: "Trainer" },
      { name: "Raghav", role: "Trainer" },
      { name: "Ayush", role: "Trainer" },
      { name: "Abhishek Negi", role: "Trainer" },
    ],

    // Programmes. `img`/`video` keys refer to shared/img and shared/video. Each one shows the thing it illustrates,
    // and no still or clip is shared with another programme or with a floor. `video: null` = no matching footage yet
    // Bhangra and Zumba: the club's Drive has no class footage, so they use licensed stock photos (`stock: true`,
    // see FS.credits) — render the still only and tag it "Illustrative".
    programs: [
      { id: "strength", name: "Strength Floor", kind: "Open floor", cat: "strength", intensity: 4, img: "press-hex", video: "row",
        short: "Free weights, racks and selectorised kit from Hoist, Matrix and Life Fitness.",
        long: "The hex-lit main floor: dumbbell racks, plate-loaded machines, benches and cable stations. Coaches walk the floor, watch your form and progress you session by session." },
      { id: "pt", name: "Personal Training", kind: "1 : 1", cat: "strength", intensity: 3, img: "coach-rope", video: "coach",
        short: "One-to-one coaching built around your goals, schedule and pace.",
        long: "Every plan starts with a conversation, not a clipboard — your history, old injuries, your actual week. Then a programme that adapts as you do." },
      { id: "bodypump", name: "Les Mills BODYPUMP™", kind: "Group class", cat: "strength", intensity: 4, img: "studio-barbell", video: "studio", confirm: true,
        short: "The original barbell class: light-to-moderate weights, lots of reps, set to music.",
        long: "Licensed Les Mills programming — a full-body barbell workout that builds strength and endurance in under an hour." },
      { id: "spinning", name: "Spinning®", kind: "Group class", cat: "cardio", intensity: 5, img: "spin-row", video: "rider",
        short: "Instructor-led indoor cycling in the official spinning studio.",
        long: "Climbs, sprints and intervals on studio bikes, coached to the beat. Every rider sets their own resistance — beginners welcome." },
      { id: "bhangra", name: "Bhangra Fitness", kind: "Group class", cat: "dance", intensity: 4, img: "bhangra-class", video: null, stock: true,
        short: "Punjabi beats, big moves, serious cardio. You'll forget you're training.",
        long: "A high-energy dance workout built on bhangra steps — easy to learn, hard to stop smiling through." },
      { id: "step", name: "Step Aerobics", kind: "Group class", cat: "dance", intensity: 3, img: "step-class", video: "step",
        short: "Choreographed cardio on the step: coordination, stamina and a lot of sweat.",
        long: "A classic for a reason — rhythmic step routines that build cardio fitness and leg strength." },
      { id: "hiit", name: "HIIT", kind: "Group class", cat: "cardio", intensity: 5, img: "sled-push", video: "sled",
        short: "Short, hard intervals with battle ropes, sleds, air bikes and bodyweight work.",
        long: "Maximum effort, minimum time. Coached intervals that burn calories long after you leave." },
      { id: "functional", name: "Functional & Mobility", kind: "Studio", cat: "mobility", intensity: 3, img: "air-bike", video: "airbike",
        short: "The turf studio: sleds, ski ergs, air bikes, kettlebells, boxing bags and stretch space.",
        long: "Move better, not just more. Strength you can use outside the gym, plus mobility work that keeps you training for years." },
      { id: "zumba", name: "Zumba®", kind: "Group class", cat: "dance", intensity: 3, img: "zumba-class", video: null, stock: true, confirm: true,
        short: "Latin-inspired dance fitness — the party with a workout hidden inside.",
        long: "Easy-to-follow choreography to music you'll know. Listed on the club's Instagram; timings to confirm." },
      { id: "assessment", name: "InBody Assessment", kind: "Assessment", cat: "assess", intensity: 1, img: "inbody-scan", video: null, stock: true,
        short: "Body-composition scan plus a personal nutrition chart to guide your plan.",
        long: "Muscle, fat and water measured in about a minute on the InBody analyser. We use it to set your starting point and to show you real progress." },
      { id: "women", name: "Women's Batches", kind: "Batch", cat: "strength", intensity: 3, img: "cable-violet", video: "cable", confirm: true,
        short: "Separate women's batches in a safe, welcoming environment.",
        long: "Coached sessions for women across strength, cardio and classes — timings to confirm with the club." },
    ],

    // Illustrative weekly timetable (the club has not published one). day: 1=Mon … 6=Sat
    timetable: {
      sample: true,
      slots: [
        { t: "06:00", d: 45, cls: "spinning", days: [1, 3, 5] },
        { t: "06:00", d: 40, cls: "hiit", days: [2, 4, 6] },
        { t: "07:00", d: 55, cls: "bodypump", days: [1, 3, 5] },
        { t: "07:00", d: 45, cls: "step", days: [2, 4] },
        { t: "07:00", d: 45, cls: "bhangra", days: [6] },
        { t: "08:00", d: 60, cls: "women", days: [1, 2, 3, 4, 5, 6] },
        { t: "10:30", d: 45, cls: "functional", days: [2, 4, 6] },
        { t: "17:30", d: 40, cls: "hiit", days: [1, 3, 5] },
        { t: "18:00", d: 45, cls: "zumba", days: [2, 4, 6] },
        { t: "18:30", d: 55, cls: "bodypump", days: [2, 4] },
        { t: "19:00", d: 45, cls: "spinning", days: [1, 2, 3, 4, 5] },
        { t: "19:30", d: 45, cls: "bhangra", days: [3, 5] },
        { t: "20:00", d: 40, cls: "functional", days: [1, 3, 5] },
      ],
    },

    // Floor order is illustrative — the club confirmed "4 floors", not which zone is where.
    // img = main still, alt = second still, video = loop, more = extra stills of that floor (for galleries).
    floors: [
      { n: "G", name: "Reception & Cardio", sample: true, img: "reception-neon", alt: "cardio-members", video: "reception", more: ["treadmill-row", "stairmaster", "treadmill-console", "cardio-bikes"],
        zones: ["Reception & InBody desk", "Life Fitness treadmills", "Matrix ellipticals", "StairMaster & bikes"],
        line: "Walk in under the neon. Warm up by the windows." },
      { n: "1", name: "Strength Floor", sample: true, img: "floor-wide", alt: "dumbbells-purple", video: "floor", more: ["red-machines", "plates", "leg-press", "cable-beige"],
        zones: ["Hex-lit free-weight floor", "Hoist & Matrix machines", "Plate-loaded stations", "Dumbbell racks & benches"],
        line: "The heart of the building. LIFT · SWEAT · REPEAT on the wall." },
      { n: "2", name: "Functional & Mobility", sample: true, img: "functional-sign", alt: "turf-wide", video: "functional", more: ["mobility-zone", "ski-erg", "kettlebells", "boxing"],
        zones: ["Turf lane & sleds", "Air bikes & ski ergs", "Boxing bags & battle ropes", "Mobility & stretch zone"],
        line: "Turf underfoot, ropes in hand. Move better, not just more." },
      { n: "3", name: "Group Studio & Spin", sample: true, img: "spin-studio", alt: "bosu", video: "spin", more: ["spin-bikes", "barbell-rack", "hand-weights", "studio-bikes"],
        zones: ["Official spinning studio", "Les Mills BODYPUMP™", "Step, Bhangra & Zumba", "BOSU & core work"],
        line: "Lights down, music up. Walk in solo, leave with a crew." },
    ],

    plans: [
      { id: "m1", name: "Monthly", months: 1, price: 3500, line: "Start building your routine" },
      { id: "m3", name: "3 Months", months: 3, price: 7000, line: "The best balance of momentum and flexibility", popular: true },
      { id: "m6", name: "6 Months", months: 6, price: 12000, line: "Commit to the long game" },
      { id: "m12", name: "Annual", months: 12, price: 18000, line: "Your strongest year starts here" },
    ],
    planIncludes: { sample: true, items: ["All four floors", "Group classes", "InBody assessment", "Personal nutrition chart", "Lockers & changing rooms"] },

    // Results as published on the club's own site (names + outcome only).
    transformations: [
      { name: "Saloni Kapoor", result: "Lost ~40 kg", kg: -40, kind: "loss" },
      { name: "Gurkirat", result: "+16 kg mass", kg: 16, kind: "gain" },
      { name: "Durga Yadav", result: "+10 kg muscle", kg: 10, kind: "gain" },
      { name: "Kartik Malhotra", result: "Fat loss", kind: "loss" },
      { name: "Divyanshu Mehandiratta", result: "Fat loss", kind: "loss" },
      { name: "Vasvee Sharma", result: "Better posture & form", kind: "form" },
    ],

    // Real words from members and press, with where they were published.
    reviews: [
      { text: "Best gym ever I visited.", who: "Shivang Mishra", where: "FITPASS review", stars: 5, year: 2026 },
      { text: "Took time to understand my needs and aspirations to design a plan that is perfect for me.", who: "Rakshith", where: "Member testimonial" },
      { text: "You get the best value for money. The gym is worth more than it charges you. Fitness classes really make you sweat.", who: "Jigyasa Singh", where: "Member testimonial" },
      { text: "One of the best gyms in Dehradun.", who: "Rahul Rawat", where: "AddressGuru review", year: 2021 },
      { text: "Excellent gym with good trainers.", who: "Ritika", where: "AddressGuru review", stars: 4, year: 2021 },
      { text: "No gimmicks here. Just solid equipment, knowledgeable trainers…", who: "Stanza Living", where: "“9 best gyms in Dehradun”", press: true },
    ],

    // Heritage. Only 2009 and today are dated facts; the middle chapters are undated on purpose.
    timeline: [
      { year: "2009", title: "Doors open at Laxman Chowk", copy: "One of Dehradun's first treadmills arrives — and with it, one of the city's oldest gyms." },
      { year: "2010s", title: "The classes arrive", copy: "Les Mills BODYPUMP™, Spinning®, step, Bhangra and CrossFit-style training turn the gym into an academy.", confirm: true },
      { year: "Then", title: "Four floors, 80+ stations", copy: "Cardio, strength, a turf functional studio and a group studio — so no plan ever waits for equipment." },
      { year: "Now", title: "Measured, not guessed", copy: "InBody body-composition analysis and personal nutrition charts guide every plan." },
      { year: `${YEAR}`, title: `${["Zero","One","Two","Three","Four","Five","Six","Seven","Eight","Nine","Ten","Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen","Seventeen","Eighteen","Nineteen","Twenty"][YEAR - SINCE] || (YEAR - SINCE)} years in`, copy: "Members who pause come back — because the coaching and the floor feel like home." },
    ],

    faqs: {
      confirm: true,
      items: [
        { q: "Can I try before I join?", a: "Yes — book a free trial session and fitness assessment. A coach shows you around all four floors.", sample: true },
        { q: "Do you have women's batches?", a: "Yes. Separate women's batches run alongside the open floor. Ask us for current timings." },
        { q: "What are your opening hours?", a: "Monday to Saturday, 5:30 am – 10:00 pm. Closed on Sunday." },
        { q: "Is there parking?", a: "Yes, there's ample parking at the club on Malviya Road." },
        { q: "What does an InBody scan tell me?", a: "Muscle mass, body-fat percentage and body water, in about a minute. We use it to set your starting point and track real progress." },
        { q: "How much is personal training?", a: "It depends on how often you train and with whom. Message us on WhatsApp and we'll share options." },
        { q: "How can I pay?", a: "Cash, card, UPI and net banking." },
      ],
    },

    // Stock photos standing in until the club shoots its own (tools/media/stock.json has the sources and licences).
    credits: [
      { key: "bhangra-class", text: "“Bhangra dance class” by SFU – Communications & Marketing", licence: "CC BY 2.0", url: "https://www.flickr.com/photos/45160304@N02/14587982973" },
      { key: "zumba-class", text: "Dance-fitness class photo", licence: "Pexels Licence", url: "https://www.pexels.com/photo/group-of-people-in-a-fitness-class-5936039/" },
      { key: "inbody-scan", text: "“Longevity Medical Institute Inbody 970” by Longevitymedical (cropped; clinic logo removed)", licence: "CC BY 4.0", url: "https://commons.wikimedia.org/wiki/File:Longevity_Medical_Institute_Inbody_970.jpg" },
      { key: "inbody-console", text: "“InBody 770” by InBody India 1 (cropped)", licence: "CC BY-SA 4.0", url: "https://commons.wikimedia.org/wiki/File:InBody_770.jpg" },
    ],

    goals: [
      { id: "lose", label: "Lose fat" },
      { id: "strong", label: "Get stronger" },
      { id: "fit", label: "General fitness" },
      { id: "pt", label: "Personal training" },
      { id: "sport", label: "Sports performance" },
    ],
  };

  /* ---------- helpers ---------- */
  FS.money = (n) => "₹" + Math.round(n).toLocaleString("en-IN");
  FS.perDay = (p) => Math.round(p.price / (p.months * 30.4));
  FS.perMonth = (p) => Math.round(p.price / p.months);
  FS.program = (id) => FS.programs.find((p) => p.id === id);
  FS.wa = (text) => `https://wa.me/${FS.contact.waNumber}?text=${encodeURIComponent(text || "Hi Fitness Solutions! I'd like to know more about membership.")}`;
  FS.initials = (name) => name.split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  // Dehradun time (IST) regardless of the viewer's timezone.
  FS.nowIST = () => {
    const d = new Date(Date.now() + (new Date().getTimezoneOffset() + 330) * 60000);
    return { day: d.getDay(), mins: d.getHours() * 60 + d.getMinutes(), date: d };
  };
  FS.toMins = (hhmm) => { const [h, m] = hhmm.split(":").map(Number); return h * 60 + m; };
  FS.fmtTime = (hhmm) => { let [h, m] = hhmm.split(":").map(Number); const ap = h >= 12 ? "pm" : "am"; h = h % 12 || 12; return `${h}:${String(m).padStart(2, "0")} ${ap}`; };
  FS.openStatus = () => {
    const { day, mins } = FS.nowIST();
    const today = FS.hours.days[day];
    if (today) {
      const o = FS.toMins(today[0]), c = FS.toMins(today[1]);
      if (mins >= o && mins < c) return { open: true, text: `Open now · until ${FS.fmtTime(today[1])}` };
      if (mins < o) return { open: false, text: `Opens today at ${FS.fmtTime(today[0])}` };
    }
    for (let i = 1; i <= 7; i++) {
      const d = (day + i) % 7, h = FS.hours.days[d];
      if (h) return { open: false, text: `Closed now · opens ${i === 1 ? "tomorrow" : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d]} ${FS.fmtTime(h[0])}` };
    }
    return { open: false, text: "Closed" };
  };
  // Classes for a weekday (1–6), sorted, with live/next flags when it is today.
  FS.classesFor = (day) => {
    const { day: today, mins } = FS.nowIST();
    const list = FS.timetable.slots.filter((s) => s.days.includes(day)).sort((a, b) => FS.toMins(a.t) - FS.toMins(b.t))
      .map((s) => ({ ...s, program: FS.program(s.cls), start: FS.toMins(s.t), end: FS.toMins(s.t) + s.d }));
    if (day === today) {
      const live = list.find((s) => mins >= s.start && mins < s.end);
      const next = list.find((s) => s.start > mins);
      if (live) live.live = true;
      if (next) next.next = true;
    }
    return list;
  };

  // A real, downloadable calendar invite for a booked visit (frontend only).
  FS.ics = ({ title, start, minutes = 60, details = "" }) => {
    const pad = (n) => String(n).padStart(2, "0");
    const fmt = (d) => `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;
    const end = new Date(start.getTime() + minutes * 60000);
    const loc = `${FS.contact.address}, ${FS.contact.cityLine}`.replace(/,/g, "\\,");
    const body = [
      "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Fitness Solutions//Mockup//EN", "BEGIN:VEVENT",
      `UID:${Date.now()}@fitnesssolutions.co.in`, `DTSTAMP:${fmt(new Date())}`, `DTSTART:${fmt(start)}`, `DTEND:${fmt(end)}`,
      `SUMMARY:${title.replace(/,/g, "\\,")}`, `LOCATION:${loc}`, `DESCRIPTION:${details.replace(/\n/g, "\\n").replace(/,/g, "\\,")}`,
      "END:VEVENT", "END:VCALENDAR",
    ].join("\r\n");
    const url = URL.createObjectURL(new Blob([body], { type: "text/calendar" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: "fitness-solutions-visit.ics" });
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };

  // Build an IST Date for "day offset from today" + "HH:MM".
  FS.istDate = (offsetDays, hhmm) => {
    const { date } = FS.nowIST();
    const [h, m] = hhmm.split(":").map(Number);
    const y = date.getFullYear(), mo = date.getMonth(), d = date.getDate() + offsetDays;
    return new Date(Date.UTC(y, mo, d, h, m) - 330 * 60000); // IST → UTC
  };

  window.FS = FS;
})();
