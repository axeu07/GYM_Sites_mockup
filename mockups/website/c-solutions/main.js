/* Direction C — "Fitness, solved."
   Renders everything from window.FS (shared/data.js) and wires the three signature interactions:
   the Solution Engine (hero), Know your numbers (calculator) and the isometric Building explorer. */
(() => {
  const FS = window.FS;
  const doc = document.documentElement;
  if (!FS) { doc.classList.remove("js"); doc.classList.add("intro-seen"); return; }

  /* ---------- utilities ---------- */
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const RM = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const FINE = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const HAS_GSAP = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";
  if (RM) doc.classList.add("rm");
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const hash = (s) => { let h = 2166136261; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const num = (n, d = 0) => Number(n).toLocaleString("en-IN", { minimumFractionDigits: d, maximumFractionDigits: d });
  const TAG = { sample: '<span class="tag tag--sample">Illustrative</span>', confirm: '<span class="tag tag--confirm">To confirm</span>' };
  const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const DAY_LONG = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const WIDE = new Set(["floor", "dumbbells", "night", "spin", "reception", "functional", "rack", "ropes", "sign", "cardio", "studio"]);
  const C = FS.contact;

  // Number tween (tabular digits, eased). Remembers the last value per element.
  function tween(el, to, fmt = (v) => num(v), dur = 750) {
    if (!el) return;
    const from = el._v == null ? to : el._v;
    el._v = to;
    cancelAnimationFrame(el._raf);
    if (RM || from === to) { el.textContent = fmt(to); return; }
    const t0 = performance.now();
    const step = (t) => {
      const p = clamp((t - t0) / dur, 0, 1), e = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(from + (to - from) * e);
      if (p < 1) el._raf = requestAnimationFrame(step);
    };
    el._raf = requestAnimationFrame(step);
  }
  const imgTag = (key, alt, { cls = "", sizes = "(min-width: 1024px) 30vw, 92vw", lazy = true } = {}) =>
    `<img class="${cls}" src="${FS.img(key, true)}" srcset="${FS.img(key, true)} 800w, ${FS.img(key)} 1600w" sizes="${sizes}" alt="${esc(alt)}"${lazy ? ' loading="lazy"' : ""} decoding="async" />`;
  const vidTag = (key, { wide = false, cls = "", preload = "metadata" } = {}) => {
    const w = wide && WIDE.has(key);
    return `<video class="${cls}" muted playsinline loop preload="${preload}" poster="${FS.poster(key, w)}" src="${FS.vid(key, w)}" data-inview aria-hidden="true"></video>`;
  };
  const intBars = (n, cls = "") => `<span class="int ${cls}" aria-label="Intensity ${n} of 5">${[1, 2, 3, 4, 5].map((i) => `<i class="${i <= n ? "on" : ""}"></i>`).join("")}</span>`;

  let toastT;
  function toast(msg) {
    const t = $("#toast"); t.textContent = msg; t.hidden = false;
    clearTimeout(toastT); toastT = setTimeout(() => (t.hidden = true), 2800);
  }

  /* ---------- in-view video playback (one rule for every loop on the page) ---------- */
  const vio = "IntersectionObserver" in window ? new IntersectionObserver((entries) => {
    for (const e of entries) {
      const v = e.target;
      if (e.isIntersecting && !document.hidden && !RM && !v.dataset.manual) v.play().catch(() => {});
      else if (!v.dataset.manual) v.pause();
    }
  }, { threshold: 0.2 }) : null;
  const watchVideos = (root = document) => $$("video[data-inview]", root).forEach((v) => {
    if (v._watched) return; v._watched = true;
    if (vio) vio.observe(v); else if (!RM) v.play().catch(() => {});
  });
  document.addEventListener("visibilitychange", () => { if (document.hidden) $$("video[data-inview]").forEach((v) => v.pause()); });

  /* ---------- reveal on scroll ---------- */
  const rio = "IntersectionObserver" in window ? new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add("is-in"); if (e.target.classList.contains("hl")) e.target.classList.add("on"); rio.unobserve(e.target); }
  }), { threshold: 0.14, rootMargin: "0px 0px -6% 0px" }) : null;
  const reveal = (els, stagger = true) => els.forEach((el, i) => {
    el.classList.add("rv"); if (stagger) el.style.setProperty("--d", i % 6);
    if (rio) rio.observe(el); else el.classList.add("is-in");
  });

  /* ---------- scrolling: native only (a JS smooth-scroll library judders on large high-refresh screens) ---------- */
  const lenis = null;
  const M = window.FSMotion || { init() {}, confetti() {} };
  const navH = () => $("#nav").offsetHeight;
  function scrollToEl(el) {
    if (!el) return;
    if (lenis) lenis.scrollTo(el, { offset: -navH() - 12, duration: 1.2 });
    else el.scrollIntoView({ behavior: RM ? "auto" : "smooth", block: "start" });
  }

  /* =========================================================
     LOADER + HERO INTRO
     ========================================================= */
  function intro() {
    const hero = $(".hero");
    hero.classList.add("is-in");
    setTimeout(() => $$(".hero .hl").forEach((h) => h.classList.add("on")), RM ? 0 : 650);
    const v = $("#solVideo"); if (v && !RM) v.play().catch(() => {});
  }
  function runLoader() {
    const L = $("#loader");
    if (!L || doc.classList.contains("intro-seen") || RM) { L && L.remove(); intro(); return; }
    const pct = $("#loaderPct"), bar = $("#loaderBar"), lab = $("#loaderLabel"), scan = $(".loader__scan");
    const LABELS = [[0, "Calibrating"], [30, "Reading muscle"], [55, "Reading fat"], [80, "Writing your plan"], [100, "Ready"]];
    const D = 1350, t0 = performance.now();
    let finished = false;
    const finish = () => {
      if (finished) return; finished = true;
      L.classList.add("is-done"); intro();
      setTimeout(() => L.remove(), 700);
    };
    const step = (t) => {
      const p = clamp((t - t0) / D, 0, 1);
      const e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
      const v = Math.round(e * 100);
      pct.textContent = String(v).padStart(2, "0") + "%";
      bar.style.width = v + "%";
      scan.style.setProperty("--scan", (e * 100).toFixed(1) + "%");
      lab.textContent = LABELS.filter(([k]) => v >= k).pop()[1];
      if (p < 1) requestAnimationFrame(step); else setTimeout(finish, 240);
    };
    requestAnimationFrame(step);
    setTimeout(finish, 3200); // safety: never trap the page behind the loader
  }

  /* =========================================================
     NAV, MENU, STATUS
     ========================================================= */
  const nav = $("#nav");
  // Hide the nav (and the back pill) while scrolling down; show on any real scroll up.
  // Direction only changes after 8px of travel, so smooth-scroll's tiny final deltas don't flip it back.
  let lastY = 0, navHidden = false;
  const pillBack = $(".pill-back");
  const onScroll = () => {
    const y = window.scrollY, dy = y - lastY;
    nav.classList.toggle("is-scrolled", y > 16);
    if (Math.abs(dy) > 8) {
      navHidden = dy > 0 && y > 700 && menu.hidden && !document.body.classList.contains("pop-open");
      lastY = y;
    }
    if (y < 700) navHidden = false;
    nav.classList.toggle("is-hidden", navHidden);
    if (pillBack) pillBack.classList.toggle("is-hidden", navHidden);
  };
  const burger = $("#burger"), menu = $("#menu");
  window.addEventListener("scroll", onScroll, { passive: true }); onScroll();
  $$(".menu__links a").forEach((a, i) => a.style.setProperty("--i", i));
  function setMenu(open) {
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    menu.hidden = !open; menu.classList.toggle("is-open", open);
    document.body.style.overflow = open ? "hidden" : "";
    if (lenis) open ? lenis.stop() : lenis.start();
    $("#quickbar").classList.toggle("is-hidden", open);
    if (open) { navHidden = false; nav.classList.remove("is-hidden"); }
  }
  burger.addEventListener("click", () => setMenu(menu.hidden));
  const closeMenu = () => { if (!menu.hidden) setMenu(false); };

  function paintStatus() {
    const s = FS.openStatus();
    for (const el of [$("#navStatus"), $("#visitStatus")]) {
      if (!el) continue;
      el.classList.toggle("is-open", s.open); el.classList.toggle("is-closed", !s.open);
      el.querySelector("span").textContent = el.id === "navStatus" ? (s.open ? "Open now" : "Closed now") : s.text;
      el.title = s.text;
    }
  }
  paintStatus(); setInterval(paintStatus, 60000);

  // Active section in the nav
  const navLinks = $$(".nav__links a");
  if ("IntersectionObserver" in window) {
    const sio = new IntersectionObserver((es) => es.forEach((e) => {
      if (!e.isIntersecting) return;
      navLinks.forEach((a) => a.classList.toggle("is-active", a.getAttribute("href") === "#" + e.target.id));
    }), { rootMargin: "-45% 0px -50% 0px" });
    ["solutions", "method", "numbers", "building", "plans", "book"].forEach((id) => { const s = document.getElementById(id); if (s) sio.observe(s); });
  }

  /* =========================================================
     00 · THE SOLUTION ENGINE
     ========================================================= */
  const GOALS = [
    { id: "lose", label: "lose fat", hint: "fat loss", title: "Fat-loss Foundations", media: { v: "ropes", alt: "Battle ropes outside the entrance" },
      sum: "Lose fat and keep your strength: coached lifting plus cardio you'll actually enjoy.",
      lib: [["Full-body strength", "s", "1"], ["HIIT", "c", "2"], ["Spinning", "c", "3"], ["Full-body strength", "s", "1"], ["Bhangra / Zumba", "c", "3"], ["Mobility", "m", "2"]],
      classes: ["hiit", "spinning", "zumba", "bhangra", "bodypump", "step"],
      proj: { label: "Body fat", dir: -1, range: [3, 6], unit: "kg", fmt: (a, b) => `−${a}–${b} kg fat` } },
    { id: "muscle", label: "build muscle", hint: "size", title: "Hypertrophy Block", media: { v: "hoodie", pos: "50% 30%", alt: "A trainer curling a dumbbell under the Train Hard neon" },
      sum: "Add lean muscle with a split that trains every muscle twice a week — and eats for it.",
      lib: [["Upper · push", "s", "1"], ["Lower body", "s", "1"], ["Upper · pull", "s", "1"], ["Legs & glutes", "s", "1"], ["Arms & core", "s", "1"], ["Mobility", "m", "2"]],
      classes: ["bodypump"], exp: { new: 1.2, back: 1, regular: 0.6 },
      proj: { label: "Lean mass", dir: 1, range: [1, 2.5], unit: "kg", fmt: (a, b) => `+${a}–${b} kg muscle` } },
    { id: "strong", label: "get stronger", hint: "strength", title: "Strength Fundamentals", media: { img: "press-liftsweat", pos: "50% 40%", alt: "A member pressing heavy dumbbells overhead under the Lift Sweat Repeat sign" },
      sum: "Squat, press and deadlift with coached technique — and add weight to the bar every week.",
      lib: [["Squat day", "s", "1"], ["Press day", "s", "1"], ["Deadlift day", "s", "1"], ["BODYPUMP", "s", "3"], ["Intervals", "c", "2"], ["Mobility", "m", "2"]],
      classes: ["bodypump", "functional"], exp: { new: 1.3, back: 1, regular: 0.45 },
      proj: { label: "Main-lift strength", dir: 1, range: [20, 35], unit: "%", fmt: (a, b) => `+${a}–${b}% on your lifts` } },
    { id: "pain", label: "move without pain", hint: "back, knees", title: "Move-Well Programme", media: { img: "turf-coach", pos: "50% 40%", alt: "A trainer coaching a member through floor work on the turf" },
      sum: "Ease stiff backs and cranky knees: mobility, core and carefully coached strength.",
      lib: [["Mobility & core", "m", "2"], ["Guided strength", "s", "1"], ["Mobility & core", "m", "2"], ["Guided strength", "s", "1"], ["Easy cardio", "c", "G"], ["Stretch & reset", "m", "2"]],
      classes: ["functional"],
      proj: { label: "Mobility score", dir: 1, range: [15, 30], unit: "%", fmt: (a, b) => `+${a}–${b}% range of motion` } },
    { id: "stamina", label: "boost my stamina", hint: "cardio", title: "Engine Builder", media: { v: "cardio", alt: "Members on the cardio deck" },
      sum: "Build a bigger engine: spin, intervals and circuits that make stairs feel easy.",
      lib: [["Spinning", "c", "3"], ["HIIT", "c", "2"], ["Strength circuit", "s", "1"], ["Spinning", "c", "3"], ["Step / Bhangra", "c", "3"], ["Mobility", "m", "2"]],
      classes: ["spinning", "hiit", "step", "bhangra"],
      proj: { label: "Aerobic fitness", dir: 1, range: [10, 20], unit: "%", fmt: (a, b) => `+${a}–${b}% aerobic fitness` } },
    { id: "senior", label: "stay strong at 50+", hint: "healthy ageing", title: "Strong at Fifty-Plus", media: { img: "coach-rope-2", pos: "50% 34%", alt: "A trainer adjusting an older member's grip on the rope" },
      sum: "Stronger legs, better balance, steadier stairs — at a pace a coach sets with you.",
      lib: [["Guided strength", "s", "1"], ["Balance & mobility", "m", "2"], ["Easy cardio", "c", "G"], ["Guided strength", "s", "1"], ["Balance & mobility", "m", "2"], ["Walk & stretch", "c", "G"]],
      classes: ["functional", "step"],
      proj: { label: "Leg strength", dir: 1, range: [15, 30], unit: "%", fmt: (a, b) => `+${a}–${b}% sit-to-stand` } },
    { id: "sport", label: "train for my sport", hint: "athletes", title: "Athletic Performance", media: { v: "boxing", pos: "50% 60%", alt: "A member in gloves working the heavy bag" },
      sum: "Faster, more powerful and harder to injure: strength, speed and conditioning for your sport.",
      lib: [["Power & speed", "s", "1"], ["Intervals", "c", "2"], ["Strength", "s", "1"], ["Agility & sleds", "c", "2"], ["Mobility", "m", "2"], ["Strength", "s", "1"]],
      classes: ["hiit", "functional", "spinning"], exp: { new: 1.15, back: 1, regular: 0.7 },
      proj: { label: "Sprint & power", dir: 1, range: [5, 12], unit: "%", fmt: (a, b) => `+${a}–${b}% sprint & jump` } },
  ];
  const OPTIONS = {
    goal: GOALS.map((g) => ({ v: g.id, label: g.label, hint: g.hint })),
    days: [2, 3, 4, 5, 6].map((d) => ({ v: d, label: `${d} days`, hint: ["", "", "busy week", "steady", "committed", "serious", "all in"][d] })),
    time: [{ v: "morning", label: "mornings", hint: "6–11 am" }, { v: "evening", label: "evenings", hint: "5–10 pm" }, { v: "any", label: "any time", hint: "flexible" }],
    exp: [{ v: "new", label: "new to the gym", hint: "start here" }, { v: "back", label: "getting back into it", hint: "returning" }, { v: "regular", label: "training regularly", hint: "experienced" }],
  };
  const PLACE = { 2: [1, 4], 3: [1, 3, 5], 4: [1, 2, 4, 5], 5: [1, 2, 3, 5, 6], 6: [1, 2, 3, 4, 5, 6] };
  const S = { goal: "lose", days: 4, time: "evening", exp: "new" };
  const goalOf = (id) => GOALS.find((g) => g.id === id) || GOALS[0];
  const optLabel = (key, v) => (OPTIONS[key].find((o) => String(o.v) === String(v)) || {}).label;

  function coaching() {
    if (["pain", "senior", "sport"].includes(S.goal) || (S.exp === "new" && S.goal === "strong"))
      return { b: "Personal training", n: S.goal === "pain" ? "1 : 1 to start — a coach checks every movement first." : "A coach programmes and watches every session." };
    if (S.exp === "new") return { b: "Coached floor + classes", n: "A floor coach teaches the lifts; classes carry the cardio." };
    return { b: "Group-coached", n: "Classes and floor coaching — add 1 : 1 any time." };
  }
  const planFor = () => FS.plans.find((p) => p.id === (S.exp === "new" ? "m3" : S.exp === "back" ? "m6" : "m12"));
  const PLAN_WHY = { m3: "enough time to see it on the InBody", m6: "long enough for real change", m12: "our best value per day" };
  function classesFit(g) {
    const inTime = (t) => S.time === "morning" ? FS.toMins(t) < 720 : S.time === "evening" ? FS.toMins(t) >= 1020 : true;
    const out = [], seen = new Set();
    for (const id of g.classes) {
      if (seen.has(id)) continue;
      const slots = FS.timetable.slots.filter((s) => s.cls === id && inTime(s.t));
      if (!slots.length) continue;
      seen.add(id);
      const s = slots[0];
      out.push({ name: FS.program(id).name, when: `${s.days.map((d) => DAY_SHORT[d]).join(" · ")} · ${FS.fmtTime(s.t)}` });
      if (out.length === 3) break;
    }
    return out;
  }
  function projection(g) {
    const f = clamp(0.55 + S.days * 0.12, 0.75, 1.27) * ((g.exp && g.exp[S.exp]) || 1);
    const r = (v) => g.proj.unit === "kg" ? Math.max(0.5, Math.round(v * 2) / 2) : Math.max(1, Math.round(v));
    return { lo: r(g.proj.range[0] * f), hi: r(g.proj.range[1] * f) };
  }

  const sol = $("#sol"), band = $(".sol__band"), solVideo = $("#solVideo"), solStill = $("#solStill");
  let mediaKey = null;
  function setMedia(g) {
    const key = g.media.v || g.media.img;
    if (key === mediaKey) return;
    const first = mediaKey === null; mediaKey = key;
    const apply = () => {
      const pos = g.media.pos || "50% 50%";
      // The first screen uses hero-grade sources: HQ camera clips (native 1080 portrait, or 1080x608 wide crops)
      // and 24 MP stills as 16:9 hero crops. Only the active goal's media loads; the others load when chosen.
      if (g.media.v) {
        const w = WIDE.has(g.media.v);
        solStill.hidden = true; solVideo.hidden = false;
        solVideo.style.objectPosition = w ? "50% 50%" : pos;
        solVideo.poster = (FS.posterHQ || FS.poster)(g.media.v, w); solVideo.src = (FS.vidHQ || FS.vid)(g.media.v, w);
        if (!RM) solVideo.play().catch(() => {});
      } else {
        solVideo.pause(); solVideo.hidden = true; solVideo.removeAttribute("src"); solVideo.removeAttribute("poster");
        solStill.style.objectPosition = pos;
        const hq = FS.imgHero && (FS.HQ_STILLS || []).includes(g.media.img);
        solStill.src = hq ? FS.imgHero(g.media.img, true) : FS.img(g.media.img);
        solStill.srcset = hq ? `${FS.imgHero(g.media.img, true)} 1920w, ${FS.imgHero(g.media.img)} 3200w` : `${FS.img(g.media.img, true)} 800w, ${FS.img(g.media.img)} 1600w`;
        // card width in CSS px: 40rem with this page's fluid root (sizes would read rem as 16px, so it is spelled out in vw)
        solStill.sizes = "(min-width: 1921px) calc(31.2vw + 120px), (min-width: 1100px) calc(16.8vw + 396px), (min-width: 744px) 704px, 92vw"; solStill.alt = g.media.alt || "";
        solStill.hidden = false;
      }
      requestAnimationFrame(() => band.classList.remove("is-swapping"));
    };
    if (first || RM) { apply(); return; }
    band.classList.add("is-swapping"); setTimeout(apply, 260);
  }

  function drawProjection(g, p) {
    const svg = $("#projSvg");
    const W = 320, H = 96, x0 = 6, x1 = 314, top = 10, bot = 84;
    const max = p.hi * 1.08;
    const curve = (V, t) => V * (1 - Math.pow(1 - t, 1.7));
    const y = (v) => g.proj.dir > 0 ? bot - (v / max) * (bot - top) : top + (v / max) * (bot - top);
    const pts = (V) => Array.from({ length: 25 }, (_, i) => { const t = i / 24; return [x0 + t * (x1 - x0), y(curve(V, t))]; });
    const lo = pts(p.lo), hi = pts(p.hi), mid = pts((p.lo + p.hi) / 2);
    const path = (arr) => arr.map((q, i) => `${i ? "L" : "M"}${q[0].toFixed(1)} ${q[1].toFixed(1)}`).join(" ");
    const bandD = path(hi) + " " + lo.slice().reverse().map((q) => `L${q[0].toFixed(1)} ${q[1].toFixed(1)}`).join(" ") + " Z";
    const baseY = g.proj.dir > 0 ? bot : top;
    // zero-length strokes with round caps stay perfectly round however the chart is stretched
    const dots = [8, 16, 24].map((i) => `<path class="proj__dot" d="M${mid[i][0].toFixed(1)} ${mid[i][1].toFixed(1)}h.01"/>`).join("");
    svg.innerHTML = `<line class="proj__base" x1="${x0}" y1="${baseY}" x2="${x1}" y2="${baseY}"/><path class="proj__band" d="${bandD}"/><path class="proj__mid" d="${path(mid)}"/>${dots}`;
    if (!RM && svg.animate) {
      // length on screen (the stroke does not scale with the viewBox), and no dash left behind once drawn
      const m = $(".proj__mid", svg), box = svg.getBoundingClientRect(), sx = box.width / W || 1, sy = box.height / H || 1;
      let len = 0; for (let i = 1; i < mid.length; i++) len += Math.hypot((mid[i][0] - mid[i - 1][0]) * sx, (mid[i][1] - mid[i - 1][1]) * sy);
      len = Math.ceil(len) + 4;
      m.style.strokeDasharray = len;
      const a = m.animate([{ strokeDashoffset: len }, { strokeDashoffset: 0 }], { duration: 900, easing: "cubic-bezier(.2,.7,.2,1)", fill: "both" });
      a.onfinish = () => { a.cancel(); m.style.strokeDasharray = ""; };
      $(".proj__band", svg).animate([{ opacity: 0 }, { opacity: 1 }], { duration: 700, easing: "ease-out", fill: "both" });
    }
  }

  // Type a string in, a few characters at a time (with a caret while it types).
  function typeIn(el, text) {
    clearTimeout(el._tt);
    if (RM) { el.textContent = text; return; }
    let i = 0; const stepN = Math.max(1, Math.ceil(text.length / 16));
    el.classList.add("typing");
    const step = () => { i = Math.min(text.length, i + stepN); el.textContent = text.slice(0, i); if (i < text.length) el._tt = setTimeout(step, 26); else el.classList.remove("typing"); };
    el.textContent = ""; step();
  }
  // Digits shuffle for a moment, then settle (the prescription number being "written").
  function scramble(el, finalText) {
    clearInterval(el._si);
    if (RM) { el.textContent = finalText; return; }
    let n = 0; el.classList.add("scrambling");
    el._si = setInterval(() => {
      if (++n > 9) { clearInterval(el._si); el.textContent = finalText; el.classList.remove("scrambling"); return; }
      el.textContent = finalText.replace(/\d/g, () => Math.floor(Math.random() * 10));
    }, 42);
  }
  $("#solPlan").innerHTML = `<span id="solPlanName"></span> <span class="mono sol__price" id="solPrice"></span>`;
  function renderSolution(animate = true) {
    const g = goalOf(S.goal);
    const anim = animate && !RM;
    const h0 = anim ? sol.offsetHeight : 0;
    // slots text
    $$(".slot").forEach((b) => { $(".slot__val", b).textContent = optLabel(b.dataset.slot, S[b.dataset.slot]); });
    $$(".goal-chip").forEach((c) => c.setAttribute("aria-pressed", String(c.dataset.goal === S.goal)));
    // titles: fade the summary, type the title in, scramble the Rx code, sweep a scan line over the card
    const rx = `Rx · FS-${(hash(S.goal + S.days + S.time + S.exp) % 9000) + 1000}`;
    const swap = () => {
      if (anim) typeIn($("#solTitle"), g.title); else $("#solTitle").textContent = g.title;
      $("#solSum").textContent = g.sum;
      if (anim) scramble($("#solRx"), rx); else $("#solRx").textContent = rx;
      sol.classList.remove("is-updating");
    };
    if (anim) {
      sol.classList.add("is-updating"); setTimeout(swap, 200);
      sol.classList.remove("is-scanning"); void sol.offsetWidth; sol.classList.add("is-scanning");
      clearTimeout(sol._sc); sol._sc = setTimeout(() => sol.classList.remove("is-scanning"), 1300);
    } else swap();
    setMedia(g);

    // week strip
    const placed = PLACE[S.days]; let k = 0; const used = new Set(["G"]);
    const cells = [1, 2, 3, 4, 5, 6].map((d) => {
      if (placed.includes(d)) { const [label, type, floor] = g.lib[k++ % g.lib.length]; used.add(floor); return { d, label, type }; }
      return { d, label: "Rest", type: "r" };
    });
    cells.push({ d: 0, label: "Closed", type: "x" });
    $("#solWeek").innerHTML = cells.map((c, i) => `<div class="day day--${c.type}${animate && !RM ? " flip" : ""}" role="listitem" style="--i:${i}"><span class="day__d">${DAY_SHORT[c.d]}</span><span class="day__s">${esc(c.label)}</span></div>`).join("")
      + "";
    // floors
    let fi = 0;
    $("#solFloors").innerHTML = ["G", "1", "2", "3"].map((f) => `<span class="fl${used.has(f) ? " on" + (anim ? " fl--pop" : "") : ""}" title="Floor ${f}" style="--i:${used.has(f) ? fi++ : 0}">${f}</span>`).join("");
    // coaching + plan
    const co = coaching(); $("#solCoach").textContent = co.b; $("#solCoachNote").textContent = co.n;
    const plan = planFor();
    $("#solPlanName").textContent = plan.name;
    tween($("#solPrice"), plan.price, (v) => FS.money(v), 700);
    $("#solPlanNote").textContent = `${FS.money(FS.perDay(plan))} a day — ${PLAN_WHY[plan.id]}.`;
    // classes
    const cl = classesFit(g);
    $("#solClasses").innerHTML = cl.length ? cl.map((c) => `<li><b>${esc(c.name)}</b><span>${c.when}</span></li>`).join("")
      : `<li class="none">Your coach builds these sessions on the floor — at any time that suits you.</li>`;
    // projection
    const p = projection(g);
    $("#projLabel").textContent = `12-week projection · ${g.proj.label}`;
    $("#projRange").textContent = g.proj.fmt(p.lo, p.hi);
    drawProjection(g, p);
    $("#solLive").textContent = `Updated: ${g.title}. ${S.days} days a week, ${optLabel("time", S.time)}. Recommended plan: ${plan.name}.`;
    // the card grows or shrinks smoothly when the new plan is longer or shorter
    if (anim && sol.animate) {
      const h1 = sol.offsetHeight;
      if (Math.abs(h1 - h0) > 2) sol.animate([{ height: h0 + "px" }, { height: h1 + "px" }], { duration: 460, easing: "cubic-bezier(.16,1,.3,1)" });
    }
  }

  // Popover listbox for the sentence slots
  const engine = $("#engine"), pop = $("#pop");
  let openSlot = null;
  function closePop(focus = true) {
    if (!openSlot) return;
    openSlot.setAttribute("aria-expanded", "false");
    pop.hidden = true; document.body.classList.remove("pop-open");
    if (focus) openSlot.focus({ preventScroll: true });
    openSlot = null;
  }
  function openPop(btn) {
    if (openSlot === btn) { closePop(); return; }
    if (openSlot) closePop(false);
    const key = btn.dataset.slot;
    pop.innerHTML = OPTIONS[key].map((o) => `<button type="button" class="pop__opt" role="option" data-v="${o.v}" aria-selected="${String(S[key]) === String(o.v)}"><span>${esc(o.label)}</span><small>${esc(o.hint || "")}</small></button>`).join("");
    pop.setAttribute("aria-label", { goal: "Goal", days: "Days per week", time: "Time of day", exp: "Experience" }[key]);
    pop.hidden = false; document.body.classList.add("pop-open");
    const er = engine.getBoundingClientRect(), br = btn.getBoundingClientRect();
    const left = clamp(br.left - er.left, 0, Math.max(0, er.width - pop.offsetWidth));
    pop.style.left = left + "px"; pop.style.top = (br.bottom - er.top + 8) + "px";
    pop.style.setProperty("--ox", (br.left - er.left - left + 20) + "px");
    btn.setAttribute("aria-expanded", "true"); openSlot = btn;
    const sel = $('[aria-selected="true"]', pop) || $(".pop__opt", pop); sel.focus({ preventScroll: true });
    // keep the open list on screen
    const pr = pop.getBoundingClientRect();
    if (pr.bottom > innerHeight - 12) { if (lenis) lenis.scrollTo(window.scrollY + (pr.bottom - innerHeight) + 24, { duration: 0.5 }); else window.scrollBy({ top: pr.bottom - innerHeight + 24, behavior: "smooth" }); }
  }
  $$(".slot").forEach((b) => b.addEventListener("click", (e) => { e.stopPropagation(); openPop(b); }));
  pop.addEventListener("click", (e) => {
    const o = e.target.closest(".pop__opt"); if (!o || !openSlot) return;
    const key = openSlot.dataset.slot, slotBtn = openSlot;
    S[key] = key === "days" ? +o.dataset.v : o.dataset.v;
    closePop();
    slotBtn.classList.remove("bump"); void slotBtn.offsetWidth; if (!RM) slotBtn.classList.add("bump");
    renderSolution(true);
  });
  pop.addEventListener("keydown", (e) => {
    const opts = $$(".pop__opt", pop), i = opts.indexOf(document.activeElement);
    if (e.key === "ArrowDown") { e.preventDefault(); opts[(i + 1) % opts.length].focus(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); opts[(i - 1 + opts.length) % opts.length].focus(); }
    else if (e.key === "Home") { e.preventDefault(); opts[0].focus(); }
    else if (e.key === "End") { e.preventDefault(); opts[opts.length - 1].focus(); }
    else if (e.key === "Tab") closePop(false);
  });
  document.addEventListener("click", (e) => { if (openSlot && !pop.contains(e.target)) closePop(false); });
  window.addEventListener("resize", () => closePop(false));

  // Hero trust row
  const R = FS.ratings;
  $("#heroTrust").innerHTML = [
    ...R.map((r) => `<li><span class="star" aria-hidden="true">★</span><b>${r.score}</b> ${esc(r.source)} · ${esc(r.count)} ratings</li>`),
    `<li><b>${FS.brand.years} years</b> in Dehradun</li>`,
  ].join("");

  /* =========================================================
     PROOF TICKER
     ========================================================= */
  const TICK = [
    [`${FS.brand.years}`, "years in Dehradun"], ["4", "floors"], ["80+", "workout stations"],
    [`${R[0].score}★`, `${R[0].source} · ${R[0].count} ratings`], [`${R[1].score}★`, `${R[1].source} · ${R[1].count} ratings`],
    [C.instagram.followers, "on Instagram"], ["9", "coaches & staff"], [FS.equipment.join(" · "), "equipment"],
  ];
  const tickRow = (hidden) => TICK.map(([b, s]) => `<span class="ticker__item"${hidden ? ' aria-hidden="true"' : ""}><b>${esc(b)}</b><span>${esc(s)}</span></span><span class="ticker__sep"${hidden ? ' aria-hidden="true"' : ' aria-hidden="true"'}>✦</span>`).join("");
  $("#ticker").innerHTML = `<div class="marquee__half">${tickRow(false)}</div><div class="marquee__half" aria-hidden="true">${tickRow(true)}</div>`;
  const goalRow = (hidden) => GOALS.map((g) => `<button type="button" class="goal-chip" data-goal="${g.id}" aria-pressed="${g.id === S.goal}"${hidden ? ' tabindex="-1" aria-hidden="true"' : ""}><span class="goal-chip__i">I want to</span>${esc(g.label)}</button><span class="tape__sep" aria-hidden="true">✦</span>`).join("");
  $("#goalTape").innerHTML = `<div class="marquee__half">${goalRow(false)}</div><div class="marquee__half" aria-hidden="true">${goalRow(true)}</div>`;
  $("#goalTape").addEventListener("click", (e) => {
    const c = e.target.closest(".goal-chip"); if (!c) return;
    S.goal = c.dataset.goal;
    const slot = $('.slot[data-slot="goal"]'); slot.classList.remove("bump"); void slot.offsetWidth; if (!RM) slot.classList.add("bump");
    scrollToEl($("#solutions"));
    setTimeout(() => renderSolution(true), RM ? 0 : 380);
  });

  /* =========================================================
     01 · THE METHOD
     ========================================================= */
  const STEPS = [
    { k: "Diagnose", h: "Know the person.", p: "Every plan begins with a conversation, not a clipboard — your history, old injuries, your actual week. Then an InBody scan measures muscle, fat and water in about a minute.", img: "consult", y: 38, alt: "A visitor at the front desk, phone in hand" },
    { k: "Prescribe", h: "A plan with a reason.", p: "Your coach turns the numbers into a week: which sessions, which floor, which classes — plus a personal nutrition chart.", img: "coach-floor", y: 62, alt: "A trainer talking a seated member through her session on the strength floor" },
    { k: "Train", h: "Train with intent.", p: "Every session has a reason, a progression, and a coach who knows exactly when to push and when to hold back.", img: "coach-press-2", y: 58, alt: "A trainer spotting a member's dumbbell press" },
    { k: "Prove", h: "Stay for the change.", p: "Re-scan every four weeks and adjust. The goal isn't a six-week spike — it's strength that keeps working long after the photographs stop.", img: "inbody-console", y: 30, alt: "An InBody analyser's results screen: weight, muscle mass and body-fat readings", tag: true },
  ];
  $("#steps").innerHTML = STEPS.map((s, i) => `
    <li class="step" data-i="${i}" style="--y:${s.y || 50}%">
      ${imgTag(s.img, s.alt, { cls: "step__img", sizes: "10rem" })}
      <div>
        <span class="step__k">0${i + 1} · ${s.k}${s.tag ? " " + TAG.sample : ""}</span>
        <h3>${s.h}</h3>
        <p>${s.p}</p>
      </div>
    </li>`).join("");
  const CIRC = 2 * Math.PI * 150;
  const loopArc = $("#loopArc"), loopDot = $("#loopDot");
  loopArc.style.strokeDasharray = CIRC; loopArc.style.strokeDashoffset = CIRC;
  const NODE_POS = [[200, 50, 200, 22, "middle"], [350, 200, 380, 204, "start"], [200, 350, 200, 392, "middle"], [50, 200, 20, 204, "end"]];
  $("#loopNodes").innerHTML = STEPS.map((s, i) => { const [x, y, lx, ly, a] = NODE_POS[i];
    return `<g class="loop__node" data-i="${i}"><circle cx="${x}" cy="${y}" r="17"/><text class="n" x="${x}" y="${y + 4.5}" text-anchor="middle">0${i + 1}</text><text x="${lx}" y="${ly}" text-anchor="${a}">${s.k}</text></g>`; }).join("");
  const loopSvg = $(".loop__svg"); loopSvg.setAttribute("viewBox", "-80 -30 560 460");
  let loopIdx = -1;
  const ghosts = $$(".loop__ghost"), loopPulse = $("#loopPulse");
  const GH = { a: ghosts.map(() => -Math.PI / 2), target: -Math.PI / 2, run: false, last: 0, rates: [16, 9.5, 6] };
  const placeGhost = (g, a) => { g.setAttribute("cx", (200 + 150 * Math.cos(a)).toFixed(2)); g.setAttribute("cy", (200 + 150 * Math.sin(a)).toFixed(2)); };
  function ghostFrame(now) {
    const dt = Math.min(64, now - (GH.last || now)) / 1000; GH.last = now;
    let busy = false;
    ghosts.forEach((g, i) => {
      const d = GH.target - GH.a[i];
      if (Math.abs(d) < 0.002) { GH.a[i] = GH.target; } else { GH.a[i] += d * (1 - Math.exp(-dt * GH.rates[i])); busy = true; }
      placeGhost(g, GH.a[i]);
    });
    if (busy) requestAnimationFrame(ghostFrame); else GH.run = false;
  }
  function setLoop(p) {
    p = clamp(p, 0, 1);
    loopArc.style.strokeDashoffset = CIRC * (1 - p);
    const a = (-90 + p * 360) * Math.PI / 180;
    loopDot.setAttribute("cx", (200 + 150 * Math.cos(a)).toFixed(2)); loopDot.setAttribute("cy", (200 + 150 * Math.sin(a)).toFixed(2));
    GH.target = a;
    if (RM) ghosts.forEach((g) => placeGhost(g, a));
    else if (!GH.run) { GH.run = true; GH.last = 0; requestAnimationFrame(ghostFrame); }
    const idx = Math.min(3, Math.floor(p * 4 + 0.001));
    if (idx === loopIdx) return; loopIdx = idx;
    // the ring is an HTML element over the SVG (so its CSS animation runs on the compositor); .loop has the
    // viewBox's aspect ratio (-80 -30 560 460), so SVG units map straight to percentages
    if (loopPulse) { loopPulse.style.left = ((NODE_POS[idx][0] + 80) / 5.6).toFixed(3) + "%"; loopPulse.style.top = ((NODE_POS[idx][1] + 30) / 4.6).toFixed(3) + "%"; }
    $$(".loop__node").forEach((n, i) => n.classList.toggle("on", i <= idx));
    $$(".step").forEach((s, i) => s.classList.toggle("on", i === idx));
    $("#loopNum").textContent = `0${idx + 1} / 04`; $("#loopName").textContent = STEPS[idx].k;
  }
  setLoop(0);
  let methodMode = "none";
  function methodStatic() {
    // Phones, tablets, reduced motion or no GSAP: each step card drives the loop as it crosses the middle of the screen.
    if (methodMode === "static") return; methodMode = "static";
    if (!("IntersectionObserver" in window)) { setLoop(1); return; }
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) setLoop((+e.target.dataset.i + 0.98) / 4); }), { rootMargin: "-42% 0px -42% 0px" });
    $$(".step").forEach((s) => io.observe(s));
  }
  if (HAS_GSAP && !RM) {
    window.gsap.registerPlugin(window.ScrollTrigger);
    const mm = window.gsap.matchMedia();
    mm.add("(min-width: 1024px) and (min-height: 640px)", () => {
      methodMode = "pin";
      $(".method").classList.add("is-pinned");
      const st = window.ScrollTrigger.create({ trigger: ".method", start: "top top", end: "+=170%", pin: ".method__pin", anticipatePin: 1, scrub: 0.4, onUpdate: (self) => setLoop(self.progress) });
      return () => { st.kill(); $(".method").classList.remove("is-pinned"); methodMode = "none"; methodStatic(); };
    });
    mm.add("(max-width: 1023px), (max-height: 639px)", () => { methodStatic(); });
  } else methodStatic();

  /* =========================================================
     02 · KNOW YOUR NUMBERS
     ========================================================= */
  const ACT = [[1.2, "Desk-bound", "little exercise"], [1.375, "Light", "1–3 days"], [1.55, "Moderate", "3–5 days"], [1.725, "Very active", "6–7 days"], [1.9, "Athlete", "twice a day"]];
  $("#actSeg").innerHTML = ACT.map(([f, l, s], i) => `<label><input type="radio" name="act" value="${f}"${i === 1 ? " checked" : ""} /><span>${l}<small>${s}</small></span></label>`).join("");
  const inAge = $("#inAge"), inH = $("#inHeight"), inW = $("#inWeight");
  const paintRange = (r) => r.style.setProperty("--p", ((r.value - r.min) / (r.max - r.min)) * 100 + "%");
  function calc() {
    const sex = $('input[name="sex"]:checked').value, age = +inAge.value, h = +inH.value, w = +inW.value;
    const act = +$('input[name="act"]:checked').value, goal = $('input[name="cgoal"]:checked').value;
    [inAge, inH, inW].forEach(paintRange);
    $("#outAge").innerHTML = `${age} <small>yrs</small>`; $("#outHeight").innerHTML = `${h} <small>cm</small>`; $("#outWeight").innerHTML = `${w} <small>kg</small>`;
    const bmi = w / Math.pow(h / 100, 2);
    const bmr = 10 * w + 6.25 * h - 5 * age + (sex === "m" ? 5 : -161); // Mifflin–St Jeor
    const tdee = bmr * act;
    const floor = sex === "m" ? 1500 : 1200;
    const target = goal === "lose" ? Math.max(floor, tdee - 400) : goal === "gain" ? tdee + 250 : tdee;
    const protein = 1.6 * w, water = 0.035 * w;
    const cat = bmi < 18.5 ? ["Below range", "c1"] : bmi < 23 ? ["Healthy range", "c2"] : bmi < 25 ? ["Overweight", "c3"] : ["Obesity range", "c4"];
    tween($("#oBmi"), bmi, (v) => v.toFixed(1));
    const pill = $("#oBmiCat"); pill.textContent = cat[0]; pill.className = "pill " + cat[1];
    $("#oBmiMark").style.setProperty("--m", clamp((bmi - 10) / 30, 0, 1) * 100 + "%");
    tween($("#oBmr"), bmr, (v) => num(Math.round(v)));
    tween($("#oTdee"), tdee, (v) => num(Math.round(v)));
    $("#oTdeeNote").textContent = `Resting burn × ${act} for a “${ACT.find((a) => a[0] === act)[1].toLowerCase()}” week.`;
    $("#oGoalLabel").textContent = goal === "lose" ? "For fat loss" : goal === "gain" ? "To build muscle" : "To maintain";
    tween($("#oGoal"), target, (v) => num(Math.round(v)));
    $(".tile--goal").classList.toggle("gain", goal === "gain");
    $("#oGoalNote").textContent = goal === "lose" ? `A gentle ${num(Math.round(tdee - target))} kcal daily deficit.` : goal === "gain" ? "A small 250 kcal surplus — muscle, not fat." : "Hold steady while you get fitter.";
    $("#oGoalRing").style.strokeDashoffset = 113.1 * (1 - clamp(target / (tdee * 1.15), 0, 1));
    tween($("#oProtein"), protein, (v) => num(Math.round(v)));
    $("#oProteinRing").style.strokeDashoffset = 113.1 * (1 - clamp((protein * 4) / target, 0, 1));
    tween($("#oWater"), water, (v) => v.toFixed(1));
    $("#oWaterFill").style.setProperty("--fill", clamp(water / 4.5, 0.1, 1) * 100 + "%");
  }
  $("#calcForm").addEventListener("input", calc);
  $("#calcForm").addEventListener("change", calc);
  calc();
  // First time the tiles scroll into view, count up from zero for a bit of life.
  if (rio && !RM) {
    const out = $(".calc__out");
    const once = new IntersectionObserver((es) => { if (es[0].isIntersecting) { once.disconnect(); ["#oBmr", "#oTdee", "#oGoal", "#oProtein"].forEach((id) => { const el = $(id); const v = el._v; el._v = 0; tween(el, v, (x) => num(Math.round(x)), 1100); }); const b = $("#oBmi"); const bv = b._v; b._v = 10; tween(b, bv, (x) => x.toFixed(1), 1100); } }, { threshold: 0.3 });
    once.observe(out);
  }

  /* =========================================================
     03 · THE BUILDING
     ========================================================= */
  const SOLVES = { G: ["Your InBody scan", "Cardio base", "Warm-ups"], 1: ["Strength", "Muscle", "Posture"], 2: ["Mobility", "Stamina", "Sport"], 3: ["Fat loss", "Fun cardio", "Community"] };
  // Media per floor. The slab's surface, the panel's clip and the "on this floor" stills are all different shots,
  // and none of them is used by the Solution Engine or a programme card.
  const SLAB_TEX = { G: "treadmill-row", 1: "dumbbells-purple", 2: "turf-wide", 3: "studio-bikes" };
  const FLOOR_SHOTS = {   // [still, label, focal height %]: the stills are portrait, the picture area is 16:9
    G: [["stairmaster", "StairMaster climbers", 25], ["treadmill-console", "A Life Fitness treadmill console", 45], ["cardio-bikes", "Recumbent bikes under the logo sign", 55], ["ellipticals", "The row of ellipticals", 50]],
    1: [["red-machines", "The red plate-loaded corner", 60], ["plates", "Weight plates on the tree", 45], ["leg-press", "The leg press", 65], ["cable-beige", "A member at the cable station", 55]],
    2: [["mobility-zone", "The mobility zone on the turf", 45], ["ski-erg", "The SkiErg", 82], ["kettlebells", "Kettlebells by the window", 90], ["sled-zone", "Curved treadmill and air bike", 50]],
    3: [["spin-bikes", "Studio bikes in rows", 65], ["barbell-rack", "Class barbells and hand weights", 85], ["hand-weights", "Hand weights on the studio rack", 60], ["bosu", "BOSU balance work with a trainer", 62]],
  };
  const TAB_SHORT = { G: "Cardio", 1: "Strength", 2: "Functional", 3: "Studio" };
  const iso = $("#iso"), tabs = $("#bldTabs"), panel = $("#bldPanel");
  iso.innerHTML = `<span class="iso__shadow" aria-hidden="true"></span>` + FS.floors.map((f, i) => `
    <button class="slab" type="button" style="--i:${i}" data-i="${i}" aria-label="Floor ${f.n}: ${esc(f.name)}" tabindex="-1">
      <span class="slab__front" aria-hidden="true"></span><span class="slab__left" aria-hidden="true"></span>
      <span class="slab__top" style="background-image:url('${FS.img(SLAB_TEX[f.n] || f.alt, true)}')" aria-hidden="true"><span class="slab__label"><b>${f.n}</b><span>${esc(f.name)}</span></span></span>
    </button>`).join("");
  tabs.innerHTML = FS.floors.map((f, i) => `<button class="bld__tab" type="button" role="tab" id="ftab-${i}" aria-controls="bldPanel" aria-selected="false" data-i="${i}"><b>${f.n}</b><span class="full">${esc(f.name)}</span><span class="short" aria-hidden="true">${TAB_SHORT[f.n] || esc(f.name)}</span></button>`).join("");
  panel.setAttribute("role", "tabpanel");
  let floorIdx = -1, autoFloor = null, floorTouched = false;
  function setFloor(i, user) {
    if (user) { floorTouched = true; clearInterval(autoFloor); }
    if (i === floorIdx) return; floorIdx = i;
    const f = FS.floors[i];
    $$(".slab", iso).forEach((s, k) => { s.classList.toggle("on", k === i); s.classList.toggle("above", k > i); }); iso.classList.add("has-on");
    $$(".bld__tab", tabs).forEach((t, k) => { t.setAttribute("aria-selected", String(k === i)); t.tabIndex = k === i ? 0 : -1; });
    panel.setAttribute("aria-labelledby", `ftab-${i}`);
    panel.classList.remove("swap"); void panel.offsetWidth; panel.classList.add("swap");
    panel.innerHTML = `
      <div class="bld__media">${vidTag(f.video, { wide: true })}<img class="bld__still" alt="" hidden /><span class="bld__n" aria-hidden="true">${f.n}</span></div>
      <div class="bld__shots" role="group" aria-label="On this floor">
        <button class="shot shot--clip" type="button" data-shot="" aria-pressed="true" aria-label="Play the floor clip"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg></button>
        ${(FLOOR_SHOTS[f.n] || []).map(([k, a, y]) => `<button class="shot" type="button" data-shot="${k}" data-y="${y}" aria-pressed="false" aria-label="${esc(a)}" style="--y:${y}%">${imgTag(k, "", { sizes: "6rem" })}</button>`).join("")}
      </div>
      <div class="bld__body">
        <span class="k mono">Floor ${f.n} · ${f.zones.length} zones ${f.sample ? TAG.sample : ""}</span>
        <h3>${esc(f.name)}</h3>
        <p>${esc(f.line)}</p>
        <ul class="zones">${f.zones.map((z) => `<li>${esc(z)}</li>`).join("")}</ul>
        <div class="solves"><span class="k mono">Solves</span>${SOLVES[f.n].map((s) => `<span class="chip-s">${s}</span>`).join("")}</div>
        <div class="bld__ctas">
          <a class="btn btn--ink btn--sm" href="#book" data-book="floor" data-note="I'd like a tour of the ${esc(f.name)} floor.">Book a tour of this floor</a>
          <button class="btn btn--line btn--sm" type="button" data-next-floor>${i === FS.floors.length - 1 ? "Back to ground ↓" : "Next floor ↑"}</button>
        </div>
      </div>`;
    watchVideos(panel);
  }
  iso.addEventListener("click", (e) => { const s = e.target.closest(".slab"); if (s) setFloor(+s.dataset.i, true); });
  if (FINE) iso.addEventListener("mouseover", (e) => { const s = e.target.closest(".slab"); if (s) setFloor(+s.dataset.i, true); });
  tabs.addEventListener("click", (e) => { const t = e.target.closest(".bld__tab"); if (t) setFloor(+t.dataset.i, true); });
  tabs.addEventListener("keydown", (e) => {
    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) return;
    e.preventDefault(); const d = e.key === "ArrowRight" || e.key === "ArrowUp" ? 1 : -1;
    const n = (floorIdx + d + 4) % 4; setFloor(n, true); $(`#ftab-${n}`).focus();
  });
  panel.addEventListener("click", (e) => {
    if (e.target.closest("[data-next-floor]")) { setFloor((floorIdx + 1) % 4, true); return; }
    const shot = e.target.closest(".shot"); if (!shot) return;
    floorTouched = true; clearInterval(autoFloor);
    const key = shot.dataset.shot, still = $(".bld__still", panel), vid = $(".bld__media video", panel);
    $$(".shot", panel).forEach((b) => b.setAttribute("aria-pressed", String(b === shot)));
    if (key) {
      still.src = FS.img(key, true); still.srcset = `${FS.img(key, true)} 800w, ${FS.img(key)} 1600w`; still.sizes = "(min-width: 1024px) 45vw, 92vw";
      still.style.objectPosition = `50% ${shot.dataset.y || 50}%`;
      still.alt = shot.getAttribute("aria-label"); still.hidden = false; vid.pause();
    } else { still.hidden = true; still.removeAttribute("src"); still.removeAttribute("srcset"); if (!RM) vid.play().catch(() => {}); }
  });
  setFloor(1, false);
  if ("IntersectionObserver" in window) {
    const bio = new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting) {
        iso.classList.add("is-open");
        if (!floorTouched && !RM && !autoFloor) autoFloor = setInterval(() => { if (!document.hidden) setFloor((floorIdx + 1) % 4, false); }, 4800);
      } else { clearInterval(autoFloor); autoFloor = null; }
    }), { threshold: 0.35 });
    bio.observe($("#bld"));
  } else iso.classList.add("is-open");

  /* =========================================================
     04 · PROGRAMMES
     ========================================================= */
  const BEST = { strength: ["Muscle", "Strength"], pt: ["Any goal", "Injuries"], bodypump: ["Strength", "Fat loss"], spinning: ["Stamina", "Fat loss"], bhangra: ["Fat loss", "Fun"], step: ["Stamina", "Rhythm"], hiit: ["Fat loss", "Sport"], functional: ["Mobility", "Sport"], zumba: ["Fat loss", "Fun"], assessment: ["Every goal"], women: ["Fat loss", "Strength"] };
  const FLOORS_OF = { strength: ["1"], pt: ["1", "2"], bodypump: ["3"], spinning: ["3"], bhangra: ["3"], step: ["3"], hiit: ["2"], functional: ["2"], zumba: ["3"], assessment: ["G"], women: ["1", "3"] };
  const GOAL_OF_PROG = { strength: "strong", pt: "strong", bodypump: "strong", spinning: "stamina", bhangra: "lose", step: "stamina", hiit: "lose", functional: "pain", zumba: "lose", assessment: "lose", women: "lose" };
  const CATS = [["all", "All"], ["strength", "Strength"], ["cardio", "Cardio"], ["dance", "Dance"], ["mobility", "Mobility"], ["assess", "Assessment"]];
  // Spans chosen so the bento closes as a full rectangle at 2, 3, 4 and 5 columns (see style.css).
  const SPAN = { strength: "pcard--feature", functional: "pcard--w-3", assessment: "pcard--w-4" };
  $("#progFilters").innerHTML = CATS.map(([id, l], i) => `<button class="chip" type="button" role="tab" aria-selected="${i === 0}" data-cat="${id}">${l} <small>${id === "all" ? FS.programs.length : FS.programs.filter((p) => p.cat === id).length}</small></button>`).join("");
  // Personal Training's default still (a trainer with an older member) illustrates the "strong at 50+" solution in the
  // hero, so its card uses another coaching shot. Every other card uses the still and clip from shared/data.js.
  // The assessment card shows the shared InBody photo (a result reviewed beside the analyser); the "Prove" step
  // uses a different one (the analyser's results screen), so no photo appears twice.
  const PROG_IMG = { pt: "coach-chest" };
  // focal heights: PROG_Y for the still, PROG_VY for the portrait clip (trainer's and member's faces both in frame)
  const PROG_VY = { strength: 40, pt: 38, bodypump: 70, spinning: 50, step: 66, hiit: 60, functional: 40, assessment: 45, women: 45 };
  const PROG_Y = { strength: 56, pt: 58, bodypump: 76, spinning: 58, bhangra: 42, step: 76, hiit: 64, functional: 34, zumba: 50, assessment: 52, women: 42 };
  const progImg = (p) => PROG_IMG[p.id] || p.img;
  const grid = $("#progGrid");
  grid.innerHTML = FS.programs.map((p) => `
    <button class="pcard ${SPAN[p.id] || ""}" type="button" data-prog="${p.id}" data-cat="${p.cat}" aria-label="${esc(p.name)} — details">
      <span class="pcard__media" aria-hidden="true" style="--y:${PROG_Y[p.id] || 50}%">${imgTag(progImg(p), "", { sizes: SPAN[p.id] === "pcard--feature" ? "(min-width: 1024px) 40vw, 92vw" : SPAN[p.id] ? "(min-width: 1024px) 44vw, 92vw" /* wide cards span two columns */ : "(min-width: 1024px) 22vw, 46vw" })}</span>
      <span class="pcard__top"><span class="pcard__kind">${esc(p.kind)}</span>${p.stock ? TAG.sample : p.confirm ? TAG.confirm : '<span class="pcard__go" aria-hidden="true">→</span>'}</span>
      <span class="pcard__bottom">
        <span class="pcard__name">${esc(p.name)}</span>
        <span class="pcard__short">${esc(p.short)}</span>
        <span class="pcard__meta">${intBars(p.intensity)}<span class="pcard__best">${BEST[p.id].map((b) => `<span>${b}</span>`).join("")}</span></span>
      </span>
    </button>`).join("");
  const ensureCardVideo = (card) => {
    if (RM || $("video", card)) return $("video", card);
    const p = FS.program(card.dataset.prog);
    if (!p.video) return null;                        // Bhangra and Zumba have no class footage yet: the studio still stays
    const v = document.createElement("video");
    Object.assign(v, { muted: true, loop: true, playsInline: true, preload: "metadata" });
    v.setAttribute("muted", ""); v.setAttribute("playsinline", ""); v.setAttribute("aria-hidden", "true");
    v.dataset.manual = "1";
    v.src = FS.vid(p.video, false); v.style.objectPosition = `50% ${PROG_VY[p.id] || 50}%`;
    $(".pcard__media", card).appendChild(v);
    return v;
  };
  const playCard = (card, on) => {
    const v = on ? ensureCardVideo(card) : $("video", card); if (!v) return;
    if (on) { v.play().then(() => card.classList.add("is-playing")).catch(() => {}); }
    else { v.pause(); card.classList.remove("is-playing"); }
  };
  if (FINE) {
    grid.addEventListener("mouseover", (e) => { const c = e.target.closest(".pcard"); if (c && !c.contains(e.relatedTarget)) playCard(c, true); });
    grid.addEventListener("mouseout", (e) => { const c = e.target.closest(".pcard"); if (c && !c.contains(e.relatedTarget)) playCard(c, false); });
  } else if ("IntersectionObserver" in window && !RM) {
    // Touch: the single most-visible card plays its loop (an in-view stand-in for hover).
    const ratios = new Map(); let playing = null;
    const pio = new IntersectionObserver((es) => {
      es.forEach((e) => ratios.set(e.target, e.isIntersecting ? e.intersectionRatio : 0));
      let best = null, br = 0.6;
      ratios.forEach((r, c) => { if (r >= br && !c.classList.contains("is-out")) { best = c; br = r; } });
      if (best !== playing) { if (playing) playCard(playing, false); playing = best; if (best) playCard(best, true); }
    }, { threshold: [0, 0.3, 0.6, 0.8, 1] });
    $$(".pcard", grid).forEach((c) => pio.observe(c));
  }
  $("#progFilters").addEventListener("click", (e) => {
    const chip = e.target.closest(".chip"); if (!chip) return;
    $$("#progFilters .chip").forEach((c) => c.setAttribute("aria-selected", String(c === chip)));
    const cat = chip.dataset.cat; let k = 0;
    $$(".pcard", grid).forEach((c) => {
      const show = cat === "all" || c.dataset.cat === cat;
      c.classList.toggle("is-out", !show); c.classList.remove("is-enter");
      if (show) { c.style.setProperty("--k", k++); void c.offsetWidth; if (!RM) c.classList.add("is-enter"); }
      else playCard(c, false);
    });
  });
  grid.addEventListener("click", (e) => { const c = e.target.closest(".pcard"); if (c) openSheet(c.dataset.prog, c); });

  /* ---------- modal manager (sheet + video) ---------- */
  let openModal = null, lastFocus = null;
  function showModal(el, panelEl) {
    lastFocus = document.activeElement;
    el.hidden = false; openModal = el;
    document.body.style.overflow = "hidden"; if (lenis) lenis.stop();
    $("#quickbar").classList.add("is-hidden");
    requestAnimationFrame(() => panelEl.focus({ preventScroll: true }));
  }
  function hideModal() {
    if (!openModal) return;
    const el = openModal; openModal = null;
    if (el.id === "vmodal") { const v = $("#vPlayer"); v.pause(); v.removeAttribute("src"); v.load(); }
    const done = () => { el.hidden = true; el.classList.remove("is-closing"); $$("video", el).forEach((v) => v.pause()); };
    if (RM || el.id === "vmodal") done(); else { el.classList.add("is-closing"); setTimeout(done, 280); }
    document.body.style.overflow = ""; if (lenis) lenis.start();
    $("#quickbar").classList.remove("is-hidden");
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }
  document.addEventListener("click", (e) => { if (e.target.closest("[data-close]")) hideModal(); });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { if (openSlot) closePop(); else if (openModal) hideModal(); else closeMenu(); return; }
    if (e.key === "Tab" && openModal) {
      const f = $$('a[href], button:not([disabled]), video[controls], [tabindex]:not([tabindex="-1"])', openModal).filter((x) => x.offsetParent !== null || x.tagName === "VIDEO");
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  function openSheet(id) {
    const p = FS.program(id); if (!p) return;
    const slots = FS.timetable.slots.filter((s) => s.cls === id).sort((a, b) => FS.toMins(a.t) - FS.toMins(b.t));
    const when = slots.length ? `<ul class="sh__when">${slots.map((s) => `<li><b>${s.days.map((d) => DAY_SHORT[d]).join(" · ")}</b><span>${FS.fmtTime(s.t)} · ${s.d} min</span></li>`).join("")}</ul>`
      : `<p class="tile__note">Runs on the floor all day — 5:30 am to 10 pm. Book a time with the desk.</p>`;
    const w = WIDE.has(p.video);
    const media = p.video
      ? `<video muted playsinline loop autoplay preload="metadata" poster="${FS.poster(p.video, w)}" src="${FS.vid(p.video, w)}" aria-hidden="true"${w ? "" : ` style="object-position:50% ${PROG_VY[id] || 50}%"`}></video>`
      : imgTag(progImg(p), "", { sizes: "(min-width: 744px) 44rem, 100vw", lazy: false });
    $("#sheetContent").innerHTML = `
      <div class="sh__media" style="--y:${PROG_Y[id] || 50}%">${media}</div>
      <div class="sh__body">
        <span class="k mono">${esc(p.kind)} ${p.confirm ? TAG.confirm : ""} ${p.stock ? '<span class="tag tag--sample">Illustrative photo</span>' : ""}</span>
        <h2 id="sheetTitle">${esc(p.name)}</h2>
        <p>${esc(p.long)}</p>
        <div class="sh__facts">
          <div><span class="k mono">Intensity</span><b>${intBars(p.intensity, "int--ink")} ${p.intensity}/5</b></div>
          <div><span class="k mono">Floor</span><b>${FLOORS_OF[id].join(" & ")}</b></div>
          <div><span class="k mono">Best for</span><b>${BEST[id].join(", ")}</b></div>
        </div>
        <div><span class="k mono">When it runs ${slots.length ? TAG.sample : ""}</span>${when}</div>
        <div class="hero__ctas">
          <a class="btn btn--yellow" href="#book" data-book="programme" data-note="I'd like to try ${esc(p.name)}." data-goal="${GOAL_OF_PROG[id]}">Try it free <span aria-hidden="true">→</span></a>
          <a class="btn btn--line" href="${FS.wa(`Hi! I'd like to know more about ${p.name} at Fitness Solutions.`)}" target="_blank" rel="noopener">Ask on WhatsApp</a>
        </div>
      </div>`;
    if (RM && $("#sheetContent video")) $("#sheetContent video").removeAttribute("autoplay");
    showModal($("#sheet"), $(".sheet__panel"));
  }

  /* =========================================================
     05 · QUIET HOURS
     ========================================================= */
  const HOURS = Array.from({ length: 17 }, (_, i) => i + 5); // 5 am → 9 pm
  const busy = (d, h) => {
    const sat = d === 6;
    const m = (sat ? 0.72 : 0.95) * Math.exp(-((h - 7) ** 2) / (2 * 1.15 ** 2));
    const e = (sat ? 0.55 : d === 5 ? 0.85 : 1) * Math.exp(-((h - 19) ** 2) / (2 * 1.45 ** 2));
    return clamp(0.1 + 0.05 * Math.sin(d * 1.7 + h * 0.9) + m + e, 0.06, 1);
  };
  const LEVEL = (v) => v < 0.3 ? ["Quiet", "b0"] : v < 0.55 ? ["Moderate", "b1"] : v < 0.8 ? ["Busy", "b2"] : ["Peak", "b3"];
  const hLabel = (h) => (h % 12 || 12) + (h < 12 ? "a" : "p");
  const now = FS.nowIST();
  let selDay = now.day >= 1 && now.day <= 6 ? now.day : 1;
  function renderHeat() {
    const n = FS.nowIST(), nowH = Math.floor(n.mins / 60);
    let html = `<span></span>` + HOURS.map((h, i) => `<span class="heat__h${i % 2 ? " mob-hide" : ""}">${hLabel(h)}</span>`).join("");
    for (let d = 1; d <= 6; d++) {
      html += `<span class="heat__d${d === selDay ? " sel" : ""}">${DAY_SHORT[d]}</span>`;
      html += HOURS.map((h, x) => { const v = busy(d, h); const isNow = d === n.day && h === nowH; return `<span class="heat__c${isNow ? " now" : ""}" style="--v:${v.toFixed(2)};--x:${x};--y:${d}" title="${DAY_SHORT[d]} ${hLabel(h)}m · ${LEVEL(v)[0]}"></span>`; }).join("");
    }
    html += `<span class="heat__d">Sun</span><span class="heat__closed">Closed on Sundays</span>`;
    $("#heat").innerHTML = html;
    const isOpen = n.day >= 1 && n.day <= 6 && nowH >= 5 && nowH < 22;
    $("#heatNow").innerHTML = isOpen ? `Right now (${DAY_SHORT[n.day]} ${hLabel(nowH)}m): <b>${LEVEL(busy(n.day, nowH))[0]}</b>` : "Closed right now — opens 5:30 am, Mon to Sat";
  }
  function renderDayplan() {
    const list = FS.classesFor(selDay);
    const n = FS.nowIST();
    // quietest 3-hour window between 9 am and 5 pm
    let best = 9, bestV = 9;
    for (let h = 9; h <= 14; h++) { const v = busy(selDay, h) + busy(selDay, h + 1) + busy(selDay, h + 2); if (v < bestV) { bestV = v; best = h; } }
    const label = selDay === n.day ? "today" : DAY_LONG[selDay];
    $("#dayplan").innerHTML = `
      <div class="daypick" role="group" aria-label="Pick a day">${[1, 2, 3, 4, 5, 6].map((d) => `<button type="button" aria-pressed="${d === selDay}" data-day="${d}">${DAY_SHORT[d]}${d === n.day ? "<small>today</small>" : ""}</button>`).join("")}</div>
      ${n.day === 0 ? '<p class="dayplan__note">Closed on Sundays — showing Monday.</p>' : ""}
      <div class="classes">${list.map((s) => { const lv = LEVEL(busy(selDay, Math.floor(s.start / 60)));
        return `<button class="crow" type="button" data-cls="${s.cls}" data-t="${s.t}">
          <span class="crow__t">${FS.fmtTime(s.t).replace(" ", "<small>")}</small></span>
          <span class="crow__n"><b>${esc(s.program.name)}</b><span>${s.d} min · Floor ${FLOORS_OF[s.cls].join("/")}</span></span>
          <span class="crow__r">${s.live ? '<span class="badge badge--live">Live now</span>' : s.next ? '<span class="badge badge--next">Next up</span>' : ""}<span class="busy ${lv[1]}">${lv[0]}</span></span>
        </button>`; }).join("")}</div>
      <p class="dayplan__note">Quietest window ${label}: <b>${hLabel(best)}m – ${hLabel(best + 3)}m</b>. The floor is open all day; classes run as above.</p>`;
  }
  renderHeat(); renderDayplan();
  $("#dayplan").addEventListener("click", (e) => {
    const b = e.target.closest("[data-day]");
    if (b) { selDay = +b.dataset.day; renderHeat(); renderDayplan(); $("#heat").classList.add("is-in"); return; }
    const r = e.target.closest(".crow");
    if (r) { const p = FS.program(r.dataset.cls); prefillBooking("class", { note: `I'd like to try ${p.name} on ${DAY_LONG[selDay]} at ${FS.fmtTime(r.dataset.t)}.`, goal: GOAL_OF_PROG[p.id] }); scrollToEl($("#book")); }
  });
  if ("IntersectionObserver" in window) {
    const hio = new IntersectionObserver((es) => { if (es[0].isIntersecting) { $("#heat").classList.add("is-in"); hio.disconnect(); } }, { threshold: 0.25 });
    hio.observe($("#heat"));
  } else $("#heat").classList.add("is-in");

  /* =========================================================
     06 · PLAN CALCULATOR
     ========================================================= */
  const SCAN = 299;
  let planId = "m3";
  $("#pcSeg").innerHTML = FS.plans.map((p) => `<label><input type="radio" name="plan" value="${p.id}"${p.id === planId ? " checked" : ""} /><span><b>${p.months}</b><small>${p.months === 1 ? "month" : "months"}</small></span>${p.popular ? '<em class="pop-dot">Popular</em>' : ""}</label>`).join("");
  $("#pcIncludes").innerHTML = FS.planIncludes.items.map((i) => `<li>${esc(i)}</li>`).join("");
  const maxPD = Math.max(...FS.plans.map(FS.perDay));
  $("#pcBars").innerHTML = FS.plans.map((x, i) => `<div class="pbar" data-id="${x.id}"><span>${esc(x.name)}</span><span class="pbar__track"><span class="pbar__fill" style="--w:${((FS.perDay(x) / maxPD) * 100).toFixed(1)}%;--k:${i}"></span></span><span class="pbar__v">${FS.money(FS.perDay(x))}/day</span></div>`).join("");
  function calcPlan() {
    const p = FS.plans.find((x) => x.id === planId);
    const scan = $("#addScan").checked ? SCAN * p.months : 0, pt = $("#addPt").checked;
    const total = p.price + scan;
    tween($("#pcTotal"), total, (v) => FS.money(v));
    $("#pcName").textContent = `${p.name}${scan ? " + re-scans" : ""}`;
    tween($("#pcMonth"), total / p.months, (v) => FS.money(v));
    tween($("#pcDay"), total / (p.months * 30.4), (v) => FS.money(v));
    const save = FS.plans[0].price * p.months - p.price;
    const saveEl = $("#pcSave"); saveEl.previousElementSibling.textContent = p.months === 1 ? "Lock-in" : "You save";
    if (p.months === 1) { cancelAnimationFrame(saveEl._raf); saveEl._v = 0; saveEl.textContent = "None"; } else tween(saveEl, save, (v) => FS.money(v));
    $("#pcBadge").hidden = !p.popular;
    $("#pcPt").hidden = !pt;
    $$("#pcBars .pbar").forEach((b) => b.classList.toggle("on", b.dataset.id === p.id));
    const msg = `Hi Fitness Solutions! I'm interested in the ${p.name} membership (${FS.money(p.price)})${scan ? " with monthly InBody re-scans" : ""}${pt ? " and personal training — could you share PT options?" : "."}`;
    $("#pcWa").href = FS.wa(msg);
    $("#pcLock").dataset.note = `Plan: ${p.name} · ${FS.money(total)}${scan ? " incl. monthly InBody re-scans" : ""}${pt ? " · interested in personal training" : ""}.`;
  }
  $("#pcSeg").addEventListener("change", (e) => { planId = e.target.value; calcPlan(); });
  $("#addScan").addEventListener("change", calcPlan); $("#addPt").addEventListener("change", calcPlan);
  calcPlan();
  const inView = (el, cb, threshold = 0.3) => {
    if (!el) return;
    if (!("IntersectionObserver" in window) || RM) { cb(); return; }
    const io = new IntersectionObserver((es) => { if (es[0].isIntersecting) { io.disconnect(); cb(); } }, { threshold });
    io.observe(el);
  };
  inView($("#pc"), () => $("#pc").classList.add("is-in"), 0.25);
  // Visit map: the route draws in once the map is on screen; then a dot travels it on a loop, paused off screen.
  const cmap = $("#cmap"), cmSvg = $(".cmap", cmap), cmMove = $("#cmMove");
  inView(cmap, () => {
    cmap.classList.add("is-in");
    if (RM || !cmMove || !cmMove.beginElement) return;
    setTimeout(() => { cmMove.beginElement(); cmap.classList.add("is-moving"); }, 1900);
    if ("IntersectionObserver" in window) new IntersectionObserver((es) => es.forEach((e) => (e.isIntersecting ? cmSvg.unpauseAnimations() : cmSvg.pauseAnimations()))).observe(cmap);
  }, 0.35);

  /* =========================================================
     07 · RESULTS
     ========================================================= */
  const MIN = -40, MAX = 20, Z = ((0 - MIN) / (MAX - MIN)) * 100;
  const numeric = FS.transformations.filter((t) => typeof t.kg === "number");
  $("#dchart").innerHTML = numeric.map((t) => `
      <div class="drow">
        <div class="drow__lab"><b>${esc(t.name)}</b><span class="${t.kg < 0 ? "neg" : "pos"}">${t.kg > 0 ? "+" : "−"}<span class="cnt" data-to="${Math.abs(t.kg)}">${Math.abs(t.kg)}</span> kg · ${esc(t.result.replace(/^[+−-]?\s*~?\d+\s*kg\s*/i, "").replace(/^Lost\s*~?\d+\s*kg/i, "fat lost") || (t.kg < 0 ? "lost" : "gained"))}</span></div>
        <div class="drow__track" style="--z:${Z}%"><span class="drow__zero"></span><span class="drow__bar ${t.kg < 0 ? "neg" : "pos"}" style="--w:${(Math.abs(t.kg) / (MAX - MIN)) * 100}%"></span></div>
      </div>`).join("") + `<div class="dchart__axis" aria-hidden="true"><span>−40</span><span>−20</span><span>0</span><span>+20 kg</span></div>`;
  $("#resQuals").innerHTML = FS.transformations.filter((t) => typeof t.kg !== "number").map((t) => `<li><b>${esc(t.name)}</b>${esc(t.result)}</li>`).join("");
  if ("IntersectionObserver" in window) {
    const dio = new IntersectionObserver((es) => { if (es[0].isIntersecting) {
      $("#dchart").classList.add("is-in"); dio.disconnect();
      if (!RM) $$("#dchart .cnt").forEach((c) => { const to = +c.dataset.to; c._v = 0; tween(c, to, (v) => num(Math.round(v)), 1200); });
    } }, { threshold: 0.3 });
    dio.observe($("#dchart"));
  } else $("#dchart").classList.add("is-in");
  $("#ratings").innerHTML = FS.ratings.map((r) => `
    <div class="card rating">
      <span class="k mono">${esc(r.source)} ${r.confirm ? TAG.confirm : ""}</span>
      <div class="rating__score"><b data-to="${r.score}">${r.score}</b><span>/ 5</span></div>
      <span class="stars" role="img" aria-label="${r.score} out of 5 stars"><i style="--p:${(r.score / 5) * 100}%"></i></span>
      <span class="tile__note">${esc(r.count)} ratings</span>
      <a href="${r.url}" target="_blank" rel="noopener">See on ${esc(r.source)} ↗</a>
    </div>`).join("");
  inView($("#ratings"), () => {
    $("#ratings").classList.add("is-in");
    if (!RM) $$("#ratings .rating__score b").forEach((b) => { b._v = 0; tween(b, +b.dataset.to, (v) => v.toFixed(1), 1300); });
  }, 0.4);
  $("#reviews").innerHTML = FS.reviews.map((r) => `
    <figure class="card review${r.press ? " review--press" : ""}">
      <q>${esc(r.text)}</q>
      <footer><div><b>${esc(r.who)}</b><span>${esc(r.where)}${r.year ? " · " + r.year : ""}</span></div>${r.stars ? `<span class="stars" role="img" aria-label="${r.stars} out of 5 stars"><i style="--p:${r.stars * 20}%"></i></span>` : ""}</footer>
    </figure>`).join("");
  // video modal
  document.addEventListener("click", (e) => {
    const t = e.target.closest("[data-video]"); if (!t) return;
    const v = $("#vPlayer"), key = t.dataset.video;
    v.poster = t.dataset.still ? FS.img(t.dataset.still, true) : FS.poster(key); v.src = FS.vid(key);
    $("#vTitle").textContent = t.dataset.title; $("#vSub").textContent = t.dataset.sub || "";
    showModal($("#vmodal"), $(".vmodal__panel"));
    v.play().catch(() => {});
  });

  /* =========================================================
     08 · COACHES
     ========================================================= */
  const coachCard = (m) => {
    const first = m.name.split(" ")[0];
    if (m.lead) return `
      <article class="card coach coach--lead">
        <span class="avatar" aria-hidden="true">${FS.initials(m.name)}</span>
        <div><h3>${esc(m.name)}</h3><span class="role mono">${esc(m.role)} · Fitness Solutions</span></div>
        <ul class="creds">${m.creds.map((c) => `<li>${esc(c)}</li>`).join("")}</ul>
        <span class="on-dark">${m.credsConfirm ? TAG.confirm : ""}</span>
        <blockquote>“${esc(m.quote)}”</blockquote>
        <a class="btn btn--yellow btn--sm" href="#book" data-book="coach" data-note="I'd like to meet ${esc(m.name)}.">Ask for ${esc(first)}</a>
      </article>`;
    return `
      <article class="card coach">
        <span class="avatar" aria-hidden="true">${FS.initials(m.name)}</span>
        <div><h3>${esc(m.name)}</h3><span class="role mono">${esc(m.role)}</span></div>
        <a class="btn btn--line btn--sm" href="#book" data-book="coach" data-note="Coach preference: ${esc(m.name)}." aria-label="Train with ${esc(first)}"><span class="lbl-l">Train with ${esc(first)}</span><span class="lbl-s">Book a session</span></a>
      </article>`;
  };
  $("#team").innerHTML = FS.team.filter((m) => m.lead).map(coachCard).join("") + `<div class="team__grid">${FS.team.filter((m) => !m.lead).map(coachCard).join("")}</div>`;

  /* =========================================================
     09 · FAQ (instant search)
     ========================================================= */
  const faqs = FS.faqs.items;
  $("#faqList").innerHTML = faqs.map((f, i) => `
    <div class="qa" data-i="${i}">
      <button class="qa__q" type="button" aria-expanded="${i === 0}" aria-controls="qa-${i}" id="qq-${i}"><span>${esc(f.q)}</span><i aria-hidden="true"></i></button>
      <div class="qa__a" id="qa-${i}" role="region" aria-labelledby="qq-${i}"><div><p>${esc(f.a)}</p></div></div>
    </div>`).join("");
  $("#faqList").addEventListener("click", (e) => {
    const q = e.target.closest(".qa__q"); if (!q) return;
    q.setAttribute("aria-expanded", String(q.getAttribute("aria-expanded") !== "true"));
  });
  const faqSearch = $("#faqSearch");
  function filterFaq() {
    const raw = faqSearch.value.trim(), words = raw.toLowerCase().split(/\s+/).filter(Boolean);
    const rx = words.length ? new RegExp("(" + words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|") + ")", "gi") : null;
    let shown = 0;
    $$(".qa").forEach((el) => {
      const f = faqs[+el.dataset.i], hay = (f.q + " " + f.a).toLowerCase();
      const ok = words.every((w) => hay.includes(w));
      el.hidden = !ok; if (ok) shown++;
      const mark = (s) => rx ? esc(s).replace(rx, "<mark>$1</mark>") : esc(s);
      $(".qa__q span", el).innerHTML = mark(f.q); $(".qa__a p", el).innerHTML = mark(f.a);
      if (ok && words.length) $(".qa__q", el).setAttribute("aria-expanded", "true");
    });
    $("#faqCount").textContent = words.length ? `${shown} of ${faqs.length}` : "";
    $("#faqEmpty").hidden = shown > 0;
    $("#faqAsk").href = FS.wa(`Hi Fitness Solutions! I have a question: ${raw}`);
  }
  faqSearch.addEventListener("input", filterFaq);
  $("#faqAsk").href = FS.wa();

  /* =========================================================
     10 · BOOKING
     ========================================================= */
  const BGOALS = [...GOALS.map((g) => [g.id, g.label[0].toUpperCase() + g.label.slice(1)]), ["pt", "Personal training"], ["look", "Just looking around"]];
  $("#bGoal").innerHTML = BGOALS.map(([v, l]) => `<option value="${v}">${esc(l)}</option>`).join("");
  const MORNING = ["06:00", "06:30", "07:00", "07:30", "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30"];
  const EVENING = ["16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00"];
  const B = { off: null, t: null };
  function openDays() {
    const n = FS.nowIST(), out = [];
    for (let off = 0; out.length < 7 && off < 14; off++) {
      const d = new Date(n.date.getFullYear(), n.date.getMonth(), n.date.getDate() + off);
      if (!FS.hours.days[d.getDay()]) continue;
      if (off === 0 && n.mins + 60 > FS.toMins(EVENING[EVENING.length - 1])) continue; // too late for today
      out.push({ off, d });
    }
    return out;
  }
  const DAYS = openDays();
  const dayKey = (d) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  $("#bDays").innerHTML = DAYS.map(({ off, d }, i) => `<button type="button" class="dchip" role="radio" aria-checked="false" data-off="${off}" data-k="${i}"><small>${off === 0 ? "Today" : off === 1 ? "Tmrw" : DAY_SHORT[d.getDay()]}</small><b>${d.getDate()}</b><em>${MONTHS[d.getMonth()]}</em></button>`).join("");
  function renderSlots() {
    const day = DAYS.find((x) => x.off === B.off);
    if (!day) { $("#bSlots").innerHTML = `<p class="tile__note">Pick a day first.</p>`; return; }
    const n = FS.nowIST(), k = dayKey(day.d);
    const pref = S.time;
    const group = (name, list, suggested) => `<div class="slots__group"><span class="k mono">${name}${suggested ? ' <span class="tag tag--sample">Suggested</span>' : ""}</span><div class="slots__grid">${list.map((t) => {
      const past = day.off === 0 && FS.toMins(t) < n.mins + 60, booked = hash(k + t) % 5 === 0;
      return `<button type="button" class="tslot" role="radio" aria-checked="${B.t === t}" data-t="${t}"${past || booked ? " disabled" : ""} aria-label="${FS.fmtTime(t)}${booked ? " (booked)" : past ? " (unavailable)" : ""}">${FS.fmtTime(t).replace(" ", "")}</button>`;
    }).join("")}</div></div>`;
    $("#bSlots").innerHTML = group("Morning", MORNING, pref === "morning") + group("Evening", EVENING, pref === "evening");
    $("#bSlotHint").textContent = `· ${DAY_LONG[day.d.getDay()]} ${day.d.getDate()} ${MONTHS[day.d.getMonth()]}`;
  }
  function pickDay(off) {
    B.off = off; B.t = null;
    $$(".dchip").forEach((c) => { const on = +c.dataset.off === off; c.setAttribute("aria-checked", String(on)); if (on && pickDay._ready) popChip(c); });
    pickDay._ready = true;
    renderSlots(); stepDone();
  }
  $("#bDays").addEventListener("click", (e) => { const c = e.target.closest(".dchip"); if (c) pickDay(+c.dataset.off); });
  $("#bSlots").addEventListener("click", (e) => {
    const s = e.target.closest(".tslot"); if (!s || s.disabled) return;
    B.t = s.dataset.t; $$(".tslot").forEach((x) => x.setAttribute("aria-checked", String(x === s)));
    $("#errSlot").hidden = true; popChip(s); stepDone();
  });
  function popChip(el) { if (RM) return; el.classList.remove("just"); void el.offsetWidth; el.classList.add("just"); clearTimeout(el._pj); el._pj = setTimeout(() => el.classList.remove("just"), 600); }
  // The three numbered steps tick off as they are completed.
  function stepDone() {
    const st = $$(".bstep");
    if (!st.length) return;
    st[0].classList.toggle("done", B.off != null);
    st[1].classList.toggle("done", !!B.t);
    let d = $("#bPhone").value.replace(/\D/g, ""); if (d.length === 12 && d.startsWith("91")) d = d.slice(2); if (d.length === 11 && d.startsWith("0")) d = d.slice(1);
    st[2].classList.toggle("done", $("#bName").value.trim().length >= 2 && /^[6-9]\d{9}$/.test(d));
  }
  $$(".bstep__n").forEach((n) => { n.innerHTML = `<b>${n.textContent}</b><i aria-hidden="true">✓</i>`; });
  const freeSlots = (day) => { const n = FS.nowIST(), k = dayKey(day.d); return [...MORNING, ...EVENING].filter((t) => !(day.off === 0 && FS.toMins(t) < n.mins + 60) && hash(k + t) % 5 !== 0).length; };
  if (DAYS.length) pickDay((DAYS.find((d) => freeSlots(d) >= 6) || DAYS[0]).off);

  function prefillBooking(src, el) {
    const d = el && el.dataset ? el.dataset : el || {};
    const goalSel = $("#bGoal"), note = $("#bNote");
    if (src === "engine") {
      const g = goalOf(S.goal);
      goalSel.value = S.goal;
      note.value = `My solution: ${g.title} — ${S.days} days a week, ${optLabel("time", S.time)}, ${optLabel("exp", S.exp)}.`;
    } else if (src === "numbers") {
      const cg = $('input[name="cgoal"]:checked').value;
      goalSel.value = cg === "gain" ? "muscle" : cg === "lose" ? "lose" : "stamina";
      note.value = "I'd like the InBody scan to check my numbers.";
    } else if (d.note) {
      note.value = d.note;
      if (d.goal) goalSel.value = d.goal;
      if (src === "programme" || src === "class") hideModal();
    }
    renderSlots();
    const booker = $("#booker"); booker.classList.remove("flash"); void booker.offsetWidth; if (!RM) booker.classList.add("flash");
    if (!$("#ticket").hidden) { $("#ticket").hidden = true; $("#bform").hidden = false; }
  }

  // All in-page links: smooth scroll (+ booking prefill for "Book" links)
  document.addEventListener("click", (e) => {
    const a = e.target.closest('a[href^="#"]'); if (!a) return;
    const id = a.getAttribute("href"); if (id.length < 2) return;
    const t = document.querySelector(id); if (!t) return;
    e.preventDefault();
    if (a.dataset.book) prefillBooking(a.dataset.book, a);
    closeMenu();
    if (openModal) hideModal();
    scrollToEl(id === "#top" ? document.body : t);
  });

  const bName = $("#bName"), bPhone = $("#bPhone");
  const setErr = (input, errId, show) => { $(errId).hidden = !show; input.closest(".field").classList.toggle("invalid", show); input.setAttribute("aria-invalid", String(show)); };
  bName.addEventListener("input", () => { setErr(bName, "#errName", false); stepDone(); });
  bPhone.addEventListener("input", () => { setErr(bPhone, "#errPhone", false); stepDone(); });
  const phoneDigits = (v) => { let d = v.replace(/\D/g, ""); if (d.length === 12 && d.startsWith("91")) d = d.slice(2); if (d.length === 11 && d.startsWith("0")) d = d.slice(1); return d; };
  $("#bform").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = bName.value.trim(), phone = phoneDigits(bPhone.value);
    const okName = name.length >= 2, okPhone = /^[6-9]\d{9}$/.test(phone), okSlot = B.off != null && !!B.t;
    setErr(bName, "#errName", !okName); setErr(bPhone, "#errPhone", !okPhone); $("#errSlot").hidden = okSlot;
    if (!okSlot) { $("#bSlots").scrollIntoView({ block: "center", behavior: RM ? "auto" : "smooth" }); return; }
    if (!okName) { bName.focus(); return; }
    if (!okPhone) { bPhone.focus(); return; }
    renderTicket({ name, phone, goal: $("#bGoal").selectedOptions[0].textContent, note: $("#bNote").value.trim() });
  });

  function qrSVG(seed) {
    const N = 25; let s = seed || 1; const rnd = () => ((s = Math.imul(s ^ (s >>> 15), 2246822519) ^ Math.imul(s ^ (s >>> 13), 3266489917)) >>> 0) / 4294967296;
    const finder = (x, y) => x < 7 && y < 7 || x >= N - 7 && y < 7 || x < 7 && y >= N - 7;
    const inFinder = (x, y, ox, oy) => { const a = x - ox, b = y - oy; if (a < 0 || b < 0 || a > 6 || b > 6) return null; return a === 0 || b === 0 || a === 6 || b === 6 || (a >= 2 && a <= 4 && b >= 2 && b <= 4); };
    let r = "";
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      let on;
      if (finder(x, y)) on = inFinder(x, y, 0, 0) ?? inFinder(x, y, N - 7, 0) ?? inFinder(x, y, 0, N - 7);
      else if ((x === 7 || y === 7 || x === N - 8 || y === N - 8) && (x < 8 || y < 8 || x > N - 9 || y > N - 9)) on = false;
      else on = rnd() > 0.52;
      if (on) r += `<rect x="${x}" y="${y}" width="1.02" height="1.02"/>`;
    }
    return `<svg class="tk__qr" viewBox="-1 -1 ${N + 2} ${N + 2}" role="img" aria-label="Booking code">${r}</svg>`;
  }
  let lastBooking = null;
  function renderTicket(f) {
    const day = DAYS.find((x) => x.off === B.off);
    const ref = `FS-AS-${(hash(f.name + f.phone + B.off + B.t) % 90000) + 10000}`;
    const dayTxt = day.off === 0 ? "today" : day.off === 1 ? "tomorrow" : `${DAY_LONG[day.d.getDay()]}`;
    const dateTxt = `${DAY_SHORT[day.d.getDay()]} ${day.d.getDate()} ${MONTHS[day.d.getMonth()]}`;
    const time = FS.fmtTime(B.t);
    const phoneFmt = `${f.phone.slice(0, 5)} ${f.phone.slice(5)}`;
    lastBooking = { ...f, ref, off: day.off, t: B.t, dateTxt, time };
    const wa = FS.wa(`Hi Fitness Solutions! I'd like to confirm my free assessment.\nRef: ${ref}\nName: ${f.name}\nWhen: ${dateTxt}, ${time}\nGoal: ${f.goal}${f.note ? "\nNote: " + f.note : ""}`);
    const tk = $("#ticket");
    tk.innerHTML = `
      <div class="tk-slot" aria-hidden="true"></div>
      <div class="tk">
        <div class="tk__top">
          <div>
            <span class="k mono">Free assessment · reserved</span>
            <h3 class="tk__title">See you <em>${esc(dayTxt)}</em>, <span class="nw">${esc(time)}.</span></h3>
            <span class="tk__ref">REF ${ref}</span>
          </div>
          ${qrSVG(hash(ref))}
        </div>
        <div class="tk__perf" aria-hidden="true"></div>
        <div class="tk__grid">
          <div><span class="k mono">Name</span><b>${esc(f.name)}</b></div>
          <div><span class="k mono">Mobile</span><b>+91 ${phoneFmt}</b></div>
          <div><span class="k mono">When</span><b>${esc(dateTxt)} · ${esc(time)}</b></div>
          <div><span class="k mono">Goal</span><b>${esc(f.goal)}</b></div>
        </div>
      </div>
      <p class="tk__bring">Bring comfortable clothes, trainers and a water bottle. The InBody scan reads best before a big meal. Ask for the front desk at Laxman Chowk.</p>
      <div class="tk__acts">
        <a class="btn btn--yellow" href="${wa}" target="_blank" rel="noopener">Send on WhatsApp</a>
        <button class="btn btn--ink" type="button" data-ics>Add to calendar</button>
        <button class="btn btn--line" type="button" data-edit>Change booking</button>
      </div>`;
    $("#bform").hidden = true; tk.hidden = false;
    tk.focus({ preventScroll: true });
    scrollToEl($("#booker"));
    if (!RM) setTimeout(() => M.confetti($(".tk__title", tk)), 900);
  }
  $("#ticket").addEventListener("click", (e) => {
    if (e.target.closest("[data-ics]") && lastBooking) {
      const b = lastBooking;
      FS.ics({ title: "Free assessment — Fitness Solutions", start: FS.istDate(b.off, b.t), minutes: 30, details: `Ref ${b.ref}\nGoal: ${b.goal}${b.note ? "\n" + b.note : ""}\nBring comfortable clothes, trainers and water.` });
      toast("Calendar invite downloaded");
    }
    if (e.target.closest("[data-edit]")) { $("#ticket").hidden = true; $("#bform").hidden = false; bName.focus({ preventScroll: true }); }
  });

  /* ---------- visit + footer + contact links ---------- */
  $("#visitAddr").innerHTML = `<b>Fitness Solutions</b>${esc(C.address)}<br>${esc(C.locality)}<br>${esc(C.cityLine)}`;
  const today = FS.nowIST().day;
  $("#hoursList").innerHTML = [1, 2, 3, 4, 5, 6, 0].map((d) => { const h = FS.hours.days[d];
    return `<li class="${d === today ? "today" : ""}"><span>${DAY_LONG[d]}${d === today ? " · today" : ""}</span><span>${h ? `${FS.fmtTime(h[0])} – ${FS.fmtTime(h[1])}` : "Closed"}</span></li>`; }).join("")
    + `<li><span>${TAG.confirm}</span><span>${esc(C.parking)}</span></li>`;
  const setLink = (sel, href, text) => { const el = $(sel); if (!el) return; el.href = href; if (text != null) el.textContent = text; };
  setLink("#mapOpen", C.mapsUrl); setLink("#vDir", C.mapsUrl); setLink("#vCall", C.phoneHref); setLink("#vWa", FS.wa()); setLink("#vMail", `mailto:${C.email}`);
  setLink("#qbWa", FS.wa()); setLink("#qbCall", C.phoneHref);
  setLink("#fCall", C.phoneHref, `Call ${C.phone}`); setLink("#fWa", FS.wa(), `WhatsApp ${C.whatsapp}`); setLink("#fMail", `mailto:${C.email}`, "Email the director");
  setLink("#fIg", C.instagram.url, `Instagram ${C.instagram.handle}`); setLink("#fFb", C.facebook.url, "Facebook");
  $$("[data-wa]").forEach((a) => (a.href = FS.wa(a.dataset.wa)));
  $("#footAddr").innerHTML = `${esc(C.address)},<br>${esc(C.cityLine)}`;
  $("#footHours").innerHTML = `${esc(FS.hours.label)}<br>${esc(FS.hours.sunday)} ${TAG.confirm}`;
  $("#year").textContent = new Date().getFullYear();

  /* ---------- reveals ---------- */
  reveal($$(".section__head > *, .method__head > *:not(.loop)"), true);
  reveal($$(".calc__in, .tile, .bld__stage, .bld__panel, .heat-wrap, .pc__in, .pc__out, .res-chart, .rating, .media-tile, .review, .coach, .faq__box, .booker, .visit"), true);
  reveal($$(".step"), true);
  $$(".hl").forEach((h) => { if (!h.closest(".hero")) { if (rio) rio.observe(h); else h.classList.add("on"); } });

  /* ---------- go ---------- */
  $$(".pcard").forEach((c) => c.classList.add("spot", "spot--tilt"));
  $$(".tile, .review, .coach, .rating, .step, .qa, .res-chart").forEach((c) => c.classList.add("spot"));
  watchVideos();
  renderSolution(false);
  M.init();
  runLoader();
  window.addEventListener("load", () => { if (HAS_GSAP) window.ScrollTrigger.refresh(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (HAS_GSAP) window.ScrollTrigger.refresh(); });
  window.__fsReady = true;
})();
