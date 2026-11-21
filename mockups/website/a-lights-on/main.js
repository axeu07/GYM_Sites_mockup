/* Fitness Solutions — Direction A · "Lights On". Renders window.FS and wires every interaction.
   Pinned moments (hero lights, manifesto, elevator) use native position: sticky + scroll-derived progress,
   so they stay smooth on touch screens and need no animation library. Scrolling is native.
   Media: every still/clip is used in one place only and only for what it shows — see research/media-catalogue.md. */
(() => {
  "use strict";
  const FS = window.FS;
  if (!FS) { console.warn("Fitness Solutions data (shared/data.js) failed to load"); return; }

  /* ---------- helpers ---------- */
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const root = document.documentElement;
  const RM = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const FINE = window.matchMedia("(hover: hover) and (pointer: fine)");
  if (RM) root.classList.add("rm");
  if (!FINE.matches) root.classList.add("touch");
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const TAG = (k) => k === "confirm"
    ? '<span class="tag tag--confirm" title="Found in public sources — confirm with the club">To confirm</span>'
    : '<span class="tag" title="Placeholder written for this mockup">Illustrative</span>';
  const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const DOW_LONG = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const CAT = {
    strength: { label: "Strength", c: "var(--yellow)" },
    cardio: { label: "Cardio", c: "var(--pink)" },
    dance: { label: "Dance", c: "var(--glow)" },
    mobility: { label: "Mobility", c: "#CFC2FF" },
  };
  const CLASS_FLOOR = { spinning: "3", bodypump: "3", step: "3", bhangra: "3", zumba: "3", hiit: "2", functional: "2", women: "1", strength: "1", pt: "1", assessment: "G" };
  const FLOOR_CHIPS = { G: ["Life Fitness", "Matrix", "Star Trac"], 1: ["Hoist", "Matrix", "Life Fitness"], 2: ["Turf lane", "Air bikes", "Ski ergs"], 3: ["Les Mills BODYPUMP™", "Spinning®"] };
  // Crew photos. Trainers get coaching moments (a trainer with a member); the manager's row shows the manager on the floor.
  // Nobody is named in a photo: these stand in until the team shoot.
  const COACH_IMGS = ["coach-chest", "coach-floor", "coach-seated", "coach-stretch", "coach-watch", "purple-coach-woman", "turf-coach"];
  const DESK_IMG = "manager"; // the manager herself on the floor (seen from behind, MANAGER on her hoodie)
  // Elevator: the hero already shows the wide pan of the strength floor, so Floor 1 plays the dumbbell racks instead.
  const FLOOR_CLIP = { 1: "dumbbells" };
  const fclip = (f) => FLOOR_CLIP[f.n] || f.video;
  // Framing of each floor clip inside the stage / card (object-position), so signs and subjects are not cut off.
  const CLIP_POS = { reception: "50% 46%", dumbbells: "50% 55%", functional: "50% 12%", spin: "50% 60%" };
  // "Look around" stills for each floor (floors[i].more in the shared data) with a short label each.
  const LOOK = {
    "treadmill-row": "Treadmills by the windows", stairmaster: "StairMaster", "treadmill-console": "Life Fitness console", "cardio-bikes": "Bikes under the logo wall",
    "red-machines": "Plate-loaded corner", plates: "Plate tree", "leg-press": "Leg press", "cable-beige": "Cable station",
    "mobility-zone": "Mobility zone", "ski-erg": "Ski ergs", kettlebells: "Kettlebells", boxing: "Boxing bag",
    "spin-bikes": "Studio bikes", "barbell-rack": "Class barbells", "hand-weights": "Hand weights", "studio-bikes": "The group studio",
  };
  const LANDSCAPE = new Set(["ellipticals", "logo-cardio", "treadmills", "turf-wide", "turf-wide-2"]);
  const srcset = (k) => LANDSCAPE.has(k) ? `${FS.img(k, true)} 800w, ${FS.img(k)} 1600w` : `${FS.img(k, true)} 500w, ${FS.img(k)} 1000w`;
  const img = (k, alt, { cls = "", sizes = "50vw", eager = false, style = "" } = {}) =>
    `<img class="${cls}" src="${FS.img(k, true)}" srcset="${srcset(k)}" sizes="${sizes}" alt="${esc(alt)}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async"${style ? ` style="${style}"` : ""}>`;
  const meter = (n, cls = "") => `<span class="meter ${cls}" role="img" aria-label="Intensity ${n} of 5">${[1, 2, 3, 4, 5].map((i) => `<i class="${i <= n ? "on" : ""}"></i>`).join("")}</span>`;
  const safePlay = (v) => { if (!v || RM) return; const p = v.play(); if (p && p.catch) p.catch(() => {}); };
  const ensureSrc = (v) => { if (v && !v.getAttribute("src") && v.dataset.src) { v.src = v.dataset.src; } };
  const hash = (s) => { let h = 2166136261; for (const ch of String(s)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return Math.abs(h); };
  const navH = () => $("#nav").offsetHeight || 64;

  /* ---------- scrolling (native) ---------- */
  const scrollToY = (y) => window.scrollTo({ top: Math.max(0, y), behavior: RM ? "auto" : "smooth" });
  const scrollToEl = (el, extra = 0) => scrollToY(el.getBoundingClientRect().top + window.scrollY - navH() + extra);
  const lockScroll = (on) => { document.body.style.overflow = on ? "hidden" : ""; };

  /* =====================================================================
     CONTENT
     ===================================================================== */
  const C = FS.contact;
  const status = () => FS.openStatus();
  function paintStatus() {
    const s = status();
    const short = s.open ? "Open now" : "Closed now";
    const nav = $("#navStatus"); nav.classList.toggle("is-open", s.open); $("span", nav).textContent = short;
    for (const id of ["#heroStatus", "#visitStatus"]) {
      const el = $(id); el.classList.toggle("is-open", s.open); $("span", el).textContent = s.text;
    }
  }
  paintStatus();
  setInterval(paintStatus, 60000);

  $("#heroEyebrow").textContent = `Laxman Chowk · ${FS.brand.city} · Since ${FS.brand.since}`;
  const jd = FS.ratings[0];
  const rate = $("#heroRating");
  rate.href = jd.url; rate.innerHTML = `<b>${jd.score}★</b> ${esc(jd.source)} · ${esc(jd.count)} ratings`;
  rate.setAttribute("aria-label", `Rated ${jd.score} out of 5 on ${jd.source} from ${jd.count} ratings (opens ${jd.source})`);

  $("#menuContact").innerHTML = `<a href="${C.phoneHref}">${esc(C.phone)}</a><a href="${FS.wa()}" target="_blank" rel="noopener">WhatsApp</a><a href="${C.instagram.url}" target="_blank" rel="noopener">Instagram</a>`;
  $("#firstTreadmill").textContent = FS.brand.lines.firstTreadmill;
  $("#womenLink").href = FS.wa("Hi Fitness Solutions! What are the current timings for the women's batches?");
  $("#ptLink").href = FS.wa("Hi Fitness Solutions! Could you share personal training options and prices?");
  $("#year").textContent = new Date().getFullYear();

  /* ---------- Manifesto photos (the real signs) ---------- */
  const MANI = [
    { k: "coach-crunch", pos: "50% 18%", cap: "On our wall · Consistency · Discipline", alt: "A coach spots a member's crunches under the neon sign reading Consistency Discipline" },
    { k: "lateral-raise", pos: "55% 22%", cap: "On our wall · Lift · Sweat · Repeat", alt: "A member does lateral raises in front of the Lift Sweat Repeat sign" },
    { k: "train-hard", pos: "50% 30%", cap: "In the dumbbell room · Train Hard", alt: "Rows of dumbbells in purple light beneath a Train Hard neon sign" },
  ];
  if (!RM) $$(".neon").forEach((w) => {
    const t = w.textContent; const buzz = 1 + (hash(t) % Math.max(1, t.length - 2));
    w.innerHTML = [...t].map((c, i) => `<span class="nl${i === buzz ? " nl--buzz" : ""}" style="--i:${i}">${c}</span>`).join("");
  });
  $("#maniPhotos").innerHTML = MANI.map((m, i) => img(m.k, m.alt, { cls: i === 0 ? "is-on" : "", sizes: "(min-width: 1024px) 40vw, 100vw", style: `object-position:${m.pos}` })).join("");

  /* ---------- Elevator ---------- */
  const FLOORS = FS.floors;
  const N = FLOORS.length;
  // Buttons laid out like a real panel: top floors first.
  const btnOrder = [...FLOORS.keys()].reverse();
  $("#elevBtns").innerHTML = btnOrder.map((i) => `<button class="fbtn" type="button" data-floor="${i}" aria-label="Floor ${FLOORS[i].n}: ${esc(FLOORS[i].name)}">${FLOORS[i].n}</button>`).join("");
  $("#elevDir").innerHTML = FLOORS.map((f, i) => `<li><button type="button" data-floor="${i}"><b>${f.n}</b><span>${esc(f.name)}</span></button></li>`).join("");
  const looks = (f) => (f.more || []).filter((k) => LOOK[k]);
  const lookBtns = (f, cls) => looks(f).map((k) => `
    <button class="${cls}" type="button" data-look="${k}" aria-pressed="false" aria-label="Look around: ${esc(LOOK[k])}">
      <img src="${FS.img(k, true)}" alt="" loading="lazy" decoding="async"><span class="sr-only">${esc(LOOK[k])}</span></button>`).join("");
  $("#stageMedia").innerHTML = FLOORS.map((f, i) =>
    `<video muted playsinline loop preload="none" poster="${FS.poster(fclip(f))}" data-src="${FS.vid(fclip(f))}" data-i="${i}" style="object-position:${CLIP_POS[fclip(f)] || "50% 50%"}" aria-hidden="true"></video>`).join("")
    + `<img class="stage__still" id="stageStill" alt="" hidden>`;
  $("#elevList").innerHTML = FLOORS.map((f, i) => `
    <article class="fcard" data-i="${i}" aria-label="Floor ${f.n}: ${esc(f.name)}">
      <div class="fcard__pic">
        <video muted playsinline loop preload="none" data-autoplay poster="${FS.poster(fclip(f))}" data-src="${FS.vid(fclip(f))}" style="object-position:${CLIP_POS[fclip(f)] || "50% 50%"}" aria-hidden="true"></video>
        <img class="fcard__still" alt="" hidden>
        <div class="fcard__shade"></div>
        <span class="fcard__n" aria-hidden="true">${f.n}</span>
        <div class="fcard__info">
          <span class="mono fcard__k">Floor ${f.n} · ${i + 1} of ${N}</span>
          <h3 class="fcard__name">${esc(f.name)}</h3>
          <p class="fcard__line">${esc(f.line)}</p>
        </div>
        <div class="door door--l" aria-hidden="true"><span class="door__mark"></span><span class="door__edge"></span></div>
        <div class="door door--r" aria-hidden="true"><span class="door__mark"></span><span class="door__edge"></span></div>
      </div>
      <div class="fcard__plate">
        <ul class="zchips">${f.zones.map((z) => `<li>${esc(z)}</li>`).join("")}</ul>
        <div class="looks looks--card" role="group" aria-label="Look around floor ${f.n}">${lookBtns(f, "look")}<span class="looks__cap mono" aria-live="polite">Look around</span></div>
      </div>
    </article>`).join("");

  const SEG = { G: "acdef", 1: "bc", 2: "abged", 3: "abgcd" };
  function setSeg(n) { const on = SEG[n] || ""; $$("#seg polygon").forEach((p) => p.classList.toggle("on", on.includes(p.dataset.s))); }
  function stageInfo(i) {
    const f = FLOORS[i];
    return `
      <span class="mono stage__k">Floor ${f.n} · ${i + 1} of ${N}</span>
      <h3 class="stage__name">${esc(f.name)}</h3>
      <p class="stage__line">${esc(f.line)}</p>
      <ul class="zlist">${f.zones.map((z) => `<li>${esc(z)}</li>`).join("")}</ul>
      <div class="brandchips">${(FLOOR_CHIPS[f.n] || []).map((b) => `<span>${esc(b)}</span>`).join("")}</div>
      <div class="looks" role="group" aria-label="Look around floor ${f.n}">${lookBtns(f, "look")}<span class="looks__cap mono" id="lookCap" aria-live="polite">Look around</span></div>`;
  }

  /* ---------- Programmes rail ---------- */
  const ORDER = ["strength", "pt", "spinning", "bodypump", "hiit", "functional", "bhangra", "step", "zumba", "women", "assessment"];
  // What each programme photo actually shows (alt text), and how to frame it in the tall card.
  const PROG_ALT = {
    strength: "A member pressing heavy dumbbells under the hexagon lamps", pt: "A trainer adjusting a member's grip on the rope attachment",
    spinning: "A rider on a studio bike in front of the cycling mural", bodypump: "The studio stage set with a barbell and a step",
    hiit: "A member pushing the sled treadmill in the functional room", functional: "A member on the air bike in the functional room",
    bhangra: "A Bhangra fitness class, arms raised (stock photo)", step: "Two people stepping on step platforms in the group studio",
    zumba: "An instructor leading a dance-fitness class (stock photo)", women: "A woman doing cable crossovers in violet light",
    assessment: "A coach reviews an InBody body-composition result on a tablet beside the analyser (stock photo)",
  };
  // The dance programmes and the InBody assessment have no usable footage from the club yet, so they show licensed
  // stock photos of the same thing, tagged "Illustrative photo" (FS.credits). neonArt stays as the fallback for a programme with no picture.
  const NEON = { bhangra: "var(--yellow)", zumba: "var(--pink)" };
  const neonArt = (p) => `
      <div class="pcard__media neonart" aria-hidden="true">
        <span class="neonart__word">${esc(p.name.replace(/[®™]/g, "").split(" ")[0])}</span>
        <span class="eq">${Array.from({ length: 13 }, (_, k) => `<i style="--k:${k}"></i>`).join("")}</span>
      </div>`;
  const PROG_POS = { strength: "50% 30%", pt: "40% 30%", assessment: "42% 50%", bodypump: "50% 70%", step: "50% 62%", hiit: "40% 50%", functional: "45% 40%", spinning: "55% 50%", bhangra: "80% 50%", zumba: "12% 50%" };
  const PROGS = ORDER.map((id) => FS.program(id)).filter(Boolean);
  $("#rail").innerHTML = PROGS.map((p, i) => `
    <article class="pcard" data-program="${p.id}">
      ${p.img ? `<div class="pcard__media">
        ${img(p.img, PROG_ALT[p.id] || `${p.name} at Fitness Solutions`, { sizes: "(min-width: 1024px) 24vw, (min-width: 600px) 46vw, 74vw", style: PROG_POS[p.id] ? `object-position:${PROG_POS[p.id]}` : "" })}
        ${p.video ? `<video muted playsinline loop preload="none" poster="${FS.img(p.img, true)}" data-src="${FS.vid(p.video)}" aria-hidden="true"></video>` : ""}
      </div>` : neonArt(p)}
      <div class="pcard__shade"></div>
      <span class="pcard__glare" aria-hidden="true"></span>
      <div class="pcard__top mono"><span>${esc(p.kind)}</span><span class="pcard__n">${String(i + 1).padStart(2, "0")} / ${PROGS.length}</span></div>
      ${p.video ? '<span class="pcard__clip mono" aria-hidden="true"><i></i>Clip</span>' : p.stock ? '<span class="pcard__clip pcard__clip--still mono">Illustrative photo</span>' : ""}
      <div class="pcard__body">
        <div class="pcard__meta mono">${meter(p.intensity)}<span>${esc(CAT[p.cat]?.label || "Assessment")}</span>${p.confirm ? TAG("confirm") : ""}</div>
        <h3 class="pcard__name">${esc(p.name)}</h3>
        <p class="pcard__short">${esc(p.short)}</p>
        <button class="pcard__more" type="button" data-drawer="${p.id}" aria-label="Details: ${esc(p.name)}">Details <span aria-hidden="true">+</span></button>
      </div>
    </article>`).join("");

  /* ---------- Board (timetable) ---------- */
  const inView = { board: false };
  const now0 = FS.nowIST();
  const board = { day: now0.day === 0 ? 1 : now0.day, filter: "all", rolled: now0.day === 0 };
  // Late in the day (or on Sunday) open on the next day that still has sessions, and flag its first one.
  if (now0.day !== 0 && !FS.classesFor(now0.day).some((s) => s.end > now0.mins)) { board.day = now0.day === 6 ? 1 : now0.day + 1; board.rolled = true; }
  board.start = board.day;
  function dayDate(d) { // next occurrence (today counts) of weekday d, in IST
    const n = FS.nowIST(); const off = (d - n.day + 7) % 7;
    const dt = new Date(n.date.getTime() + off * 86400000); return { off, dt };
  }
  function renderDays() {
    const today = FS.nowIST().day;
    $("#days").innerHTML = [1, 2, 3, 4, 5, 6].map((d) => {
      const { dt } = dayDate(d);
      const sel = d === board.day;
      return `<button class="day" type="button" role="tab" id="day-${d}" aria-selected="${sel}" aria-controls="rows" tabindex="${sel ? 0 : -1}" data-day="${d}">
        <b>${DOW[d]}</b><small>${d === today ? "Today" : `${dt.getDate()} ${MON[dt.getMonth()]}`}</small></button>`;
    }).join("");
  }
  function renderFilters() {
    const items = [["all", "All", ""], ...Object.entries(CAT).map(([k, v]) => [k, v.label, v.c])];
    $("#filters").innerHTML = items.map(([k, l, c]) => `<button class="chip" type="button" aria-pressed="${board.filter === k}" data-filter="${k}"${c ? ` style="--c:${c}"` : ""}>${c ? "<i></i>" : ""}${l}</button>`).join("");
  }
  const flaps = (hhmm) => {
    let [h, m] = hhmm.split(":").map(Number); const ap = h >= 12 ? "pm" : "am"; h = h % 12 || 12;
    const s = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    return { html: [...s].map((ch, i) => `<span class="flap${ch === ":" ? " flap--sep" : ""}" style="--d:${i * 45}">${ch}</span>`).join(""), ap };
  };
  function renderRows(flip) {
    const n = FS.nowIST();
    const isToday = board.day === n.day;
    let list = FS.classesFor(board.day);
    const total = list.length;
    if (board.filter !== "all") list = list.filter((s) => s.program && s.program.cat === board.filter);
    const note = $("#boardNote");
    const rolledView = board.rolled && board.day === board.start;
    if (n.day === 0 && board.day === 1) { note.hidden = false; note.textContent = "We're closed on Sundays — here's Monday's line-up."; }
    else if (rolledView) { note.hidden = false; note.textContent = `That's a wrap for today — here's ${DOW_LONG[board.day]}'s line-up.`; }
    else note.hidden = true;
    if (rolledView && list.length) list = list.map((s, i) => (i === 0 ? { ...s, next: true } : s));
    if (!list.length) {
      $("#rows").innerHTML = `<li class="board__empty"><span>No ${esc(CAT[board.filter]?.label.toLowerCase() || "")} sessions on ${DOW_LONG[board.day]} — ${total} other session${total === 1 ? "" : "s"} that day.</span><button class="chip" type="button" data-filter="all" aria-pressed="false">Show all</button></li>`;
      return;
    }
    const nowAt = isToday && !rolledView ? ((k) => (k < 0 ? list.length : k))(list.findIndex((x) => x.start > n.mins)) : -1;
    const nowLine = `<li class="nowline" aria-hidden="true"><span class="nowline__t mono">Now · ${String(n.date.getHours()).padStart(2, "0")}:${String(n.date.getMinutes()).padStart(2, "0")}</span><span class="nowline__beam"></span></li>`;
    $("#rows").innerHTML = list.map((s, i) => {
      const p = s.program; const f = flaps(s.t);
      const done = isToday && s.end <= n.mins;
      const st = s.live ? '<span class="badge badge--live">Live now</span>' : s.next ? '<span class="badge badge--next">Next up</span>' : done ? '<span class="badge badge--done">Done</span>' : "";
      const cls = ["row", s.live && "is-live", s.next && "is-next", done && "is-done", flip && "is-flip"].filter(Boolean).join(" ");
      return `<li class="${cls}" style="--d:${i * 70}">
        <button class="row__btn" type="button" data-book data-program="${s.cls}" data-day="${board.day}" data-time="${s.t}" aria-label="${esc(p.name)}, ${DOW_LONG[board.day]} ${FS.fmtTime(s.t)}, ${s.d} minutes${s.live ? ", live now" : s.next ? ", next up" : ""}. Book a trial.">
          <span class="row__time">${f.html}<span class="row__ap mono">${f.ap}</span></span>
          <span class="row__main"><span class="row__name">${esc(p.name)}</span></span>
          <span class="row__meta mono">${esc(p.kind)} · Floor ${CLASS_FLOOR[s.cls] || "—"} · ${s.d} min</span>
          <span class="row__int">${meter(p.intensity, s.live ? "meter--pink" : "")}</span>
          <span class="row__status">${st}</span>
          <span class="row__go" aria-hidden="true">→</span>
        </button></li>`;
    }).map((h, i) => (i === nowAt ? nowLine + h : h)).join("") + (nowAt === list.length ? nowLine : "");
    if (flip) cycleFlaps($("#rows"));
  }
  // Departure-board digits: each tile spins through a few numbers before landing (purely visual; the row's label has the time).
  function cycleFlaps(scope) {
    if (RM) return;
    $$(".flap:not(.flap--sep)", scope).forEach((f, k) => {
      const target = f.textContent, row = f.closest(".row");
      const base = (parseFloat(row && row.style.getPropertyValue("--d")) || 0) + (k % 4) * 45, ticks = 3 + (k % 3);
      const tick = (ch) => { f.textContent = ch; f._t = !f._t; f.classList.toggle("tk-a", f._t); f.classList.toggle("tk-b", !f._t); };
      for (let t = 0; t < ticks; t++) setTimeout(() => tick(String((Math.random() * 10) | 0)), base + t * 72);
      setTimeout(() => tick(target), base + ticks * 72);
    });
  }
  function paintClock() {
    const n = FS.nowIST(); const s = status();
    const hh = String(n.date.getHours()).padStart(2, "0"), mm = String(n.date.getMinutes()).padStart(2, "0");
    $("#boardClock").innerHTML = `<i></i>Dehradun · ${hh}:${mm} IST · ${s.open ? "Open now" : "Closed now"}`;
  }
  renderDays(); renderFilters(); renderRows(false); paintClock();
  $("#days").addEventListener("click", (e) => {
    const b = e.target.closest(".day"); if (!b) return;
    board.day = +b.dataset.day; renderDays(); renderRows(true); $(`#day-${board.day}`).focus({ preventScroll: true });
  });
  $("#days").addEventListener("keydown", (e) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) return;
    e.preventDefault();
    const d = e.key === "Home" ? 1 : e.key === "End" ? 6 : clamp(board.day + (e.key === "ArrowRight" ? 1 : -1), 1, 6);
    board.day = d; renderDays(); renderRows(true); $(`#day-${d}`).focus();
  });
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-filter]"); if (!b) return;
    board.filter = b.dataset.filter; renderFilters(); renderRows(true);
  });
  setInterval(() => { paintClock(); if (inView.board) renderRows(false); }, 30000);

  /* ---------- Crew ---------- */
  const lead = FS.team.find((t) => t.lead);
  const crew = FS.team.filter((t) => !t.lead);
  $("#director").innerHTML = `
    <div class="director__badge" aria-hidden="true">
      <svg viewBox="-50 -50 100 100"><polygon points="46,0 23,40 -23,40 -46,0 -23,-40 23,-40"/></svg>
      <b>${FS.initials(lead.name)}</b>
    </div>
    <span class="mono director__k">${esc(lead.role)} · Fitness Solutions</span>
    <h3 class="director__name">${esc(lead.name)}</h3>
    <ul class="director__creds">${lead.creds.map((c) => `<li>${esc(c)}</li>`).join("")}</ul>
    <p class="mono small-note">${TAG("confirm")} From his 2017 club profile</p>
    <p class="director__quote">“${esc(lead.quote)}”<span>— ${esc(lead.name)}</span></p>`;
  let coachI = 0;
  $("#roster").innerHTML = crew.map((t, i) => {
    const first = t.name.split(" ")[0];
    const desk = t.role === "Manager";
    const shot = desk ? DESK_IMG : COACH_IMGS[coachI++ % COACH_IMGS.length];
    return `<li class="crew__row" data-img="${shot}" data-cap="${desk ? "The manager, on the floor" : "On the floor"}">
      <button class="crew__btn" type="button" aria-expanded="false" aria-controls="crew-${i}">
        <span class="crew__idx mono">${String(i + 1).padStart(2, "0")}</span>
        <span class="crew__name">${esc(t.name)}</span>
        <span class="crew__role mono">${esc(t.role)}</span>
        <span class="crew__plus" aria-hidden="true">+</span>
      </button>
      <div class="crew__more" id="crew-${i}" hidden>
        ${img(shot, desk ? "A visitor at the Fitness Solutions front desk" : "A coaching moment on the Fitness Solutions floor", { sizes: "9rem" })}
        <div><p>${desk ? `${esc(first)} runs the front desk and memberships — the first person to ask about plans, batches and timings.` : `Ask for ${esc(first)} at the desk, or book a trial and we'll pair you with the right coach for your goal.`} <span class="mono" style="color:var(--dim)">Photo: ${desk ? "the front desk" : "on the floor"} · team portraits to come</span></p>
        <button class="btn btn--ghost btn--sm" type="button" data-book data-coach="${esc(t.name)}">${t.role === "Manager" ? "Talk to the desk" : `Book with ${esc(first)}`} <span aria-hidden="true">→</span></button></div>
      </div></li>`;
  }).join("");
  $("#roster").addEventListener("click", (e) => {
    const b = e.target.closest(".crew__btn"); if (!b) return;
    const open = b.getAttribute("aria-expanded") !== "true";
    $$(".crew__btn", $("#roster")).forEach((x) => { x.setAttribute("aria-expanded", "false"); $(`#${x.getAttribute("aria-controls")}`).hidden = true; });
    b.setAttribute("aria-expanded", String(open)); $(`#${b.getAttribute("aria-controls")}`).hidden = !open;
  });

  /* ---------- Scoreboard ---------- */
  const drums = (v, suf) => [...String(v)].map((d, i) => `<span class="drum" style="--i:${i}" data-n="${d}"><span class="drum__s">${"0123456789".split("").map((x) => `<span>${x}</span>`).join("")}</span></span>`).join("") + (suf ? `<span class="drum__suf">${suf}</span>` : "");
  $("#counters").innerHTML = FS.stats.map((s) => `
    <div class="counter"><b><span class="sr-only">${s.value}${s.suffix || ""}</span><span class="counter__v" aria-hidden="true">${RM ? s.value + (s.suffix || "") : drums(s.value, s.suffix)}</span></b><span class="mono">${esc(s.label)}</span></div>`).join("");
  const stars = (n) => "★★★★★".slice(0, Math.round(n)) + "☆☆☆☆☆".slice(0, 5 - Math.round(n));
  $("#ratings").innerHTML = FS.ratings.map((r) => `
    <a class="rating" href="${r.url}" target="_blank" rel="noopener" aria-label="${r.score} out of 5 on ${esc(r.source)} from ${esc(r.count)} ratings — opens ${esc(r.source)}">
      <span class="rating__score">${r.score}</span>
      <span class="rating__src"><span class="rating__stars" aria-hidden="true">${stars(r.score)}</span><span class="mono">${esc(r.source)} · ${esc(r.count)} ratings ${r.confirm ? TAG("confirm") : ""}</span></span>
      <span class="rating__go" aria-hidden="true">↗</span>
    </a>`).join("");
  const PLATE = { loss: "var(--yellow)", gain: "var(--violet)", form: "var(--pink)" };
  $("#plates").innerHTML = FS.transformations.map((t, i) => {
    const kg = typeof t.kg === "number";
    const val = kg ? `${t.kg < 0 ? "−" : "+"}${Math.abs(t.kg)}` : t.kind === "form" ? "Posture" : "Fat loss";
    const small = kg ? (t.kg < 0 ? "kg lost" : /muscle/i.test(t.result) ? "kg muscle" : "kg mass") : t.kind === "form" ? "& form" : "coached";
    return `<figure class="plate" style="--c:${PLATE[t.kind]};--si:${i}" aria-label="${esc(t.name)}: ${esc(t.result)}">
      <svg viewBox="-100 -100 200 200" aria-hidden="true">
        <defs><path id="pa${i}" d="M -77 0 A 77 77 0 1 1 77 0 A 77 77 0 1 1 -77 0"/></defs>
        <circle class="plate__ring" r="92"/><circle class="plate__in" r="66"/><circle class="plate__in" r="46"/>
        <text class="plate__name"><textPath href="#pa${i}" startOffset="25%" text-anchor="middle">${esc(t.name)}</textPath></text>
      </svg>
      <figcaption class="plate__val"><b class="${kg ? "" : "is-word"}">${val}</b><small>${small}</small></figcaption>
    </figure>`;
  }).join("");
  // Reviews marquee: two rows that drift in opposite directions; pause on hover or with the button.
  const rv = (r) => `<figure class="rv${r.press ? " rv--press" : ""}"><q>${esc(r.text)}</q>
    <footer><span><b>${esc(r.who)}</b></span><span class="mono">${esc(r.where)}${r.year ? ` · ${r.year}` : ""}</span>${r.stars ? `<span class="rv__stars" aria-label="${r.stars} stars">${"★".repeat(r.stars)}</span>` : ""}</footer></figure>`;
  const rowA = FS.reviews.filter((_, i) => i % 2 === 0), rowB = FS.reviews.filter((_, i) => i % 2 === 1);
  const half = (set) => Array.from({ length: 4 }, () => set.map(rv).join("")).join("");
  if (RM) {
    // No motion: every review once, as a calm wrapped wall.
    $("#marquee").innerHTML = `<div class="mq__row"><div class="mq__track">${FS.reviews.map(rv).join("")}</div></div>`;
  } else {
    $("#marquee").innerHTML = `
      <div class="mq__row"><div class="mq__track" style="--dur:95s">${half(rowA)}${half(rowA)}</div></div>
      <div class="mq__row mq__row--b"><div class="mq__track" style="--dur:110s">${half(rowB)}${half(rowB)}</div></div>
      <button class="chip mq__pause" type="button" aria-pressed="false" id="mqPause">Pause</button>`;
    // Screen readers get each review once, not the visual loop.
    $$(".mq__row").forEach((r) => r.setAttribute("aria-hidden", "true"));
    const srList = document.createElement("ul"); srList.className = "sr-only";
    srList.innerHTML = FS.reviews.map((r) => `<li>“${esc(r.text)}” — ${esc(r.who)}, ${esc(r.where)}</li>`).join("");
    $("#marquee").appendChild(srList);
    $("#mqPause").addEventListener("click", (e) => {
      const p = $("#marquee").classList.toggle("is-paused");
      e.currentTarget.setAttribute("aria-pressed", String(p)); e.currentTarget.textContent = p ? "Play" : "Pause";
    });
  }
  const storyImg = $("#storyImg"); storyImg.src = FS.img("member-senior", true); storyImg.srcset = srcset("member-senior"); storyImg.sizes = "(min-width: 1024px) 12rem, 50vw";
  // a frame from the middle of the film (its opening frame is the same logo sign as the hero)
  const filmImg = $("#filmImg"); filmImg.src = FS.base + "video/film-b.jpg";

  /* ---------- Passes ---------- */
  let priceMode = "total";
  function renderPasses() {
    $("#passGrid").innerHTML = FS.plans.map((p, i) => {
      const v = priceMode === "total" ? FS.money(p.price) : priceMode === "month" ? FS.money(FS.perMonth(p)) : FS.money(FS.perDay(p));
      const unit = priceMode === "total" ? (p.months === 1 ? "for 1 month" : `for ${p.months} months`) : priceMode === "month" ? "/ month" : "/ day";
      const save = p.months > 1 ? Math.round(100 - (p.price / (FS.plans[0].price * p.months)) * 100) : 0;
      return `<article class="pass${p.popular ? " pass--pop" : ""}" style="--si:${i}" aria-label="${esc(p.name)} pass, ${FS.money(p.price)}">
        <div class="pass__top mono"><span>Pass ${String(i + 1).padStart(2, "0")}</span>${p.popular ? '<span class="pass__badge">Most popular</span>' : save ? `<span>Save ${save}%</span>` : "<span>No lock-in</span>"}</div>
        <h3 class="pass__name">${esc(p.name)}</h3>
        <p class="pass__line">${esc(p.line)}</p>
        <div class="pass__price"><b>${v}</b><small class="mono">${unit}</small></div>
        <ul class="pass__inc">${FS.planIncludes.items.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
        <button class="btn ${p.popular ? "btn--yellow" : "btn--ghost"}" type="button" data-book data-plan="${p.id}">Get this pass <span aria-hidden="true">→</span></button>
        <div class="pass__stub mono"><span>Admit one</span><span>${priceMode === "total" ? `${FS.money(FS.perDay(p))} / day` : FS.money(p.price)}</span></div>
      </article>`;
    }).join("");
  }
  renderPasses();
  $("#priceMode").addEventListener("click", (e) => {
    const b = e.target.closest("[data-mode]"); if (!b) return;
    priceMode = b.dataset.mode;
    $$("#priceMode [data-mode]").forEach((x) => x.setAttribute("aria-checked", String(x === b)));
    renderPasses();
  });
  $("#priceMode").addEventListener("keydown", (e) => {
    if (!["ArrowLeft", "ArrowRight"].includes(e.key)) return;
    const bs = $$("#priceMode [data-mode]"); const i = bs.findIndex((x) => x.dataset.mode === priceMode);
    const b = bs[(i + (e.key === "ArrowRight" ? 1 : bs.length - 1)) % bs.length]; b.click(); b.focus();
  });

  /* ---------- Visit + footer ---------- */
  $("#visitAddr").innerHTML = `<b>${esc(C.address)}</b><span>${esc(C.locality)}</span><span>${esc(C.cityLine)}</span><span class="mono" style="margin-top:.5rem;color:var(--glow)">${esc(C.parking)}</span>`;
  const todayDow = FS.nowIST().day;
  $("#hours").innerHTML = [1, 2, 3, 4, 5, 6, 0].map((d) => {
    const h = FS.hours.days[d];
    return `<li class="${d === todayDow ? "is-today" : ""}${h ? "" : " is-closed"}"><span>${DOW_LONG[d]}${d === todayDow ? " · today" : ""}</span><span>${h ? `${FS.fmtTime(h[0])} – ${FS.fmtTime(h[1])}` : "Closed"}</span></li>`;
  }).join("");
  $("#visitActions").innerHTML = `
    <a class="btn btn--yellow" href="${C.mapsUrl}" target="_blank" rel="noopener">Directions <span aria-hidden="true">↗</span></a>
    <a class="btn btn--ghost" href="${C.phoneHref}">Call ${esc(C.phone)}</a>
    <a class="btn btn--ghost" href="${FS.wa()}" target="_blank" rel="noopener">WhatsApp</a>
    <a class="btn btn--ghost" href="${C.instagram.url}" target="_blank" rel="noopener">Instagram</a>`;
  const WAY = [
    { k: "signboard", t: "Spot the sign", s: "On the street, with the arrow", alt: "The Fitness Solutions signboard on the street, with an arrow pointing the way" },
    { k: "lane", t: "Follow the lane", s: "Down to the chequered floor", alt: "The lane leading down to the Fitness Solutions entrance" },
    { k: "entrance", t: "You're here", s: "Under the lit logo", alt: "The Fitness Solutions entrance with its lit logo sign" },
  ];
  $("#wayIn").innerHTML = WAY.map((w, i) => `
    <li class="wayin__step"><figure>
      <span class="wayin__img">${img(w.k, w.alt, { sizes: "(min-width: 1024px) 15vw, 30vw" })}</span>
      <figcaption><span class="mono wayin__n">0${i + 1}</span><b>${w.t}</b><small>${w.s}</small></figcaption>
    </figure></li>`).join("");
  $("#mapOpen").href = C.mapsUrl;
  $("#mapCap").textContent = `${C.address} · ${C.cityLine}`;
  $("#footAddr").innerHTML = `${esc(C.address)}<br>${esc(C.locality)}<br>${esc(C.cityLine)}`;
  $("#footTalk").innerHTML = `
    <li><a href="${C.phoneHref}">${esc(C.phone)}</a></li>
    <li><a href="${FS.wa()}" target="_blank" rel="noopener">WhatsApp ${esc(C.whatsapp)}</a></li>
    <li><a href="mailto:${C.email}">Email the director</a></li>
    <li><a href="${C.instagram.url}" target="_blank" rel="noopener">Instagram ${esc(C.instagram.handle)}</a></li>
    <li><a href="${C.facebook.url}" target="_blank" rel="noopener">Facebook</a></li>`;

  /* =====================================================================
     MODALS (booking, video, drawer) + menu
     ===================================================================== */
  const stack = [];
  const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), textarea, select, [tabindex]:not([tabindex="-1"])';
  function openLayer(el, opener) {
    if (stack.includes(el)) return;
    el.inert = false; el.classList.add("is-open");
    stack.push(el);
    el._opener = opener || document.activeElement;
    lockScroll(true);
    requestAnimationFrame(() => {
      const f = $$(FOCUSABLE, el).find((x) => x.offsetParent !== null && !x.closest("[hidden]") && !x.classList.contains("x"));
      (f || $(".x", el) || el).focus({ preventScroll: true });
    });
  }
  function closeLayer(el) {
    const i = stack.indexOf(el); if (i < 0) return;
    stack.splice(i, 1);
    el.classList.remove("is-open"); el.inert = true;
    $$("video", el).forEach((v) => v.pause());
    if (!stack.length) lockScroll(false);
    const o = el._opener; if (o && o.focus && document.contains(o)) o.focus({ preventScroll: true });
  }
  document.addEventListener("click", (e) => {
    const c = e.target.closest("[data-close]"); if (!c) return;
    const layer = c.closest(".modal, .drawer"); if (layer) closeLayer(layer);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (stack.length) { closeLayer(stack[stack.length - 1]); return; }
      if ($("#nav").classList.contains("is-open")) toggleMenu(false);
    }
    if (e.key === "Tab" && stack.length) { // keep focus inside the open dialog
      const el = stack[stack.length - 1];
      const f = $$(FOCUSABLE, el).filter((x) => x.offsetParent !== null && !x.closest("[hidden]"));
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  /* ---------- menu ---------- */
  const menu = $("#menu");
  function toggleMenu(open) {
    const nav = $("#nav"); open = open ?? !nav.classList.contains("is-open");
    nav.classList.toggle("is-open", open); menu.classList.toggle("is-open", open); menu.inert = !open;
    $("#burger").setAttribute("aria-expanded", String(open)); $("#burger").setAttribute("aria-label", open ? "Close menu" : "Open menu");
    lockScroll(open);
  }
  $("#burger").addEventListener("click", () => toggleMenu());

  /* ---------- anchors ---------- */
  document.addEventListener("click", (e) => {
    const a = e.target.closest('a[href^="#"]'); if (!a) return;
    const id = a.getAttribute("href");
    if (id.length < 2) return;
    const t = $(id); if (!t) return;
    e.preventDefault();
    if ($("#nav").classList.contains("is-open")) toggleMenu(false);
    if (id === "#top") scrollToY(0);
    else if (id === "#floors" && rigOn) scrollToY($("#elevTrack").getBoundingClientRect().top + window.scrollY - window.innerHeight * 0.35);
    else scrollToEl(t);
  });

  /* ---------- video modal ---------- */
  const MEDIA = {
    film: { cap: "The film · 0:59 · Shot on the floor at Laxman Chowk, Sep–Oct 2026" },
    "voice-senior": { cap: "Member story · 0:41 · In Hindi · Recorded at the Fitness Solutions reception" },
  };
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-media]"); if (!b) return;
    const k = b.dataset.media; const v = $("#mediaVideo");
    v.poster = FS.poster(k); v.src = FS.vid(k); $("#mediaCap").textContent = MEDIA[k]?.cap || "";
    openLayer($("#media"), b);
    const p = v.play(); if (p && p.catch) p.catch(() => {});
  });

  /* ---------- programme drawer ---------- */
  function openDrawer(id, opener) {
    const p = FS.program(id); if (!p) return;
    const runs = FS.timetable.slots.filter((s) => s.cls === p.id);
    const when = runs.length
      ? runs.map((s) => `<li><span>${s.days.map((d) => DOW[d]).join(" · ")}</span><span>${FS.fmtTime(s.t)} · ${s.d} min</span></li>`).join("")
      : `<li><span>${p.id === "assessment" ? "By appointment at the front desk" : p.id === "pt" ? "Scheduled with your coach" : "Any time we're open"}</span><span>${esc(FS.hours.label)}</span></li>`;
    $("#drawerPanel").innerHTML = `
      <button class="x" type="button" data-close aria-label="Close details">×</button>
      <div class="drawer__media">
        ${p.video
          ? `<video muted playsinline loop autoplay poster="${FS.img(p.img, true)}" src="${FS.vid(p.video)}" style="${PROG_POS[p.id] ? `object-position:${PROG_POS[p.id]}` : ""}" aria-hidden="true"></video>`
          : `<img src="${FS.img(p.img)}" alt="${esc(PROG_ALT[p.id] || p.name)}">`}
        ${p.stock ? '<span class="drawer__note mono">Illustrative photo · stock</span>' : ""}
      </div>
      <div class="drawer__body">
        <span class="mono drawer__k">${esc(p.kind)} · Floor ${CLASS_FLOOR[p.id] || "—"} ${p.confirm ? TAG("confirm") : ""}</span>
        <h2 class="drawer__title" id="drawerTitle">${esc(p.name)}</h2>
        <div class="pcard__meta mono">${meter(p.intensity)}<span>Intensity ${p.intensity} / 5</span></div>
        <p class="drawer__long">${esc(p.long)}</p>
        <div><p class="mono" style="color:var(--mute);margin-bottom:.6rem">When it runs ${runs.length ? TAG("sample") : ""}</p><ul class="drawer__when">${when}</ul></div>
        <div class="drawer__actions">
          <button class="btn btn--yellow" type="button" data-book data-program="${p.id}">Book a free ${p.id === "assessment" ? "assessment" : "trial"} <span aria-hidden="true">→</span></button>
          <a class="btn btn--ghost" href="${FS.wa(`Hi Fitness Solutions! I'd like to know more about ${p.name}.`)}" target="_blank" rel="noopener">Ask on WhatsApp</a>
        </div>
      </div>`;
    if (RM) $("#drawerPanel video")?.removeAttribute("autoplay");
    openLayer($("#drawer"), opener);
  }
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-drawer]");
    if (b) { openDrawer(b.dataset.drawer, b); return; }
    const card = e.target.closest(".pcard");
    if (card && !railDragged) openDrawer(card.dataset.program, $(".pcard__more", card));
  });

  /* ---------- booking ---------- */
  const B = { goal: null, off: null, time: null, program: null, plan: null, coach: null, step: 1 };
  const bookEl = $("#book"), form = $("#bookForm");
  const TIMES = [["07:00", "Morning", "6 – 10 am"], ["13:00", "Midday", "12 – 4 pm"], ["18:00", "Evening", "5 – 9 pm"]];
  const optHTML = (name, value, label, small, checked) =>
    `<label class="opt"><input type="radio" name="${name}" value="${esc(value)}"${checked ? " checked" : ""}><span>${label}${small ? `<small>${small}</small>` : ""}</span></label>`;
  function openDays(prefDow) {
    const n = FS.nowIST(); const out = [];
    for (let i = 0; out.length < 6 && i < 12; i++) {
      const dt = new Date(n.date.getTime() + i * 86400000); const d = dt.getDay();
      if (!FS.hours.days[d]) continue;
      if (i === 0 && n.mins > 20 * 60) continue;
      out.push({ off: i, d, label: i === 0 ? "Today" : i === 1 ? "Tomorrow" : DOW[d], small: `${dt.getDate()} ${MON[dt.getMonth()]}` });
    }
    return out;
  }
  function openBook(ds, opener) {
    Object.assign(B, { goal: null, off: null, time: null, program: ds.program || null, plan: ds.plan || null, coach: ds.coach || null, step: 1, specific: null });
    form.reset(); $("#bookErr").textContent = "";
    $$("[aria-invalid]", form).forEach((x) => x.removeAttribute("aria-invalid"));
    const prog = B.program && FS.program(B.program); const plan = B.plan && FS.plans.find((p) => p.id === B.plan);
    // context line
    const ctx = [];
    if (prog) ctx.push(`Session: ${esc(prog.name)}`);
    if (ds.time && ds.day) ctx.push(`${DOW[+ds.day]} · ${FS.fmtTime(ds.time)}`);
    if (plan) ctx.push(`Pass: ${esc(plan.name)} · ${FS.money(plan.price)}`);
    if (B.coach) ctx.push(`Coach: ${esc(B.coach)}`);
    $("#bookCtx").hidden = !ctx.length; $("#bookCtx").innerHTML = ctx.join(" <span aria-hidden='true'>·</span> ");
    // goals (preselect a sensible one from the programme)
    const preGoal = prog ? ({ strength: "strong", bodypump: "strong", pt: "pt", hiit: "lose", spinning: "lose", functional: "sport", assessment: "fit" }[prog.id] || "fit") : B.plan ? null : null;
    $("#goalChips").innerHTML = FS.goals.map((g) => optHTML("goal", g.id, esc(g.label), "", g.id === preGoal)).join("");
    // days
    const days = openDays();
    let pre = null;
    if (ds.day) {
      const want = +ds.day; const n = FS.nowIST();
      pre = days.find((x) => x.d === want && !(x.off === 0 && ds.time && FS.toMins(ds.time) <= n.mins));
    }
    $("#dayChips").innerHTML = days.map((x) => optHTML("day", x.off, x.label, x.small, pre && pre.off === x.off)).join("");
    // times (+ the specific class slot when coming from the board)
    B.specific = ds.time && prog ? { t: ds.time, name: prog.name } : null;
    $("#timeChips").innerHTML = (B.specific ? optHTML("time", B.specific.t, FS.fmtTime(B.specific.t), esc(B.specific.name), true) : "") +
      TIMES.map(([v, l, s]) => optHTML("time", v, l, s, false)).join("");
    $("#bookMain").hidden = false; $("#bookDone").hidden = true;
    goStep(1);
    openLayer(bookEl, opener);
  }
  function goStep(n) {
    B.step = n;
    $$(".step", form).forEach((s) => s.classList.toggle("is-active", +s.dataset.step === n));
    $$(".steps i", bookEl).forEach((s, i) => s.classList.toggle("is-on", i < n));
    $("#bookBack").style.visibility = n === 1 ? "hidden" : "visible";
    $("#bookNext").hidden = n === 3; $("#bookSubmit").hidden = n !== 3;
    $("#bookErr").textContent = "";
    const first = $(`.step[data-step="${n}"] input`, form);
    if (first && bookEl.classList.contains("is-open")) first.focus({ preventScroll: true });
  }
  const val = (name) => (form.elements[name] && form.elements[name].value) || "";
  const cleanPhone = (s) => { let d = String(s).replace(/\D/g, ""); if (d.length === 12 && d.startsWith("91")) d = d.slice(2); if (d.length === 11 && d.startsWith("0")) d = d.slice(1); return d; };
  function validate(n) {
    const err = (m, el) => { $("#bookErr").textContent = m; if (el) { el.setAttribute("aria-invalid", "true"); el.focus(); } return false; };
    if (n === 1 && !val("goal")) return err("Pick what you're training for — it helps us match the right coach.");
    if (n === 2 && !val("day")) return err("Choose a day to come in.");
    if (n === 2 && !val("time")) return err("Choose a time of day.");
    if (n === 3) {
      const name = $("#fName"), phone = $("#fPhone");
      name.removeAttribute("aria-invalid"); phone.removeAttribute("aria-invalid");
      if (name.value.trim().length < 2) return err("Please enter your name.", name);
      if (!/^[6-9]\d{9}$/.test(cleanPhone(phone.value))) return err("Enter a 10-digit Indian mobile number (starting 6–9).", phone);
    }
    $("#bookErr").textContent = ""; return true;
  }
  $("#bookNext").addEventListener("click", () => { if (validate(B.step)) goStep(B.step + 1); });
  $("#bookBack").addEventListener("click", () => goStep(Math.max(1, B.step - 1)));
  form.addEventListener("keydown", (e) => { if (e.key === "Enter" && e.target.tagName === "INPUT" && B.step < 3) { e.preventDefault(); $("#bookNext").click(); } });
  form.addEventListener("change", () => { $("#bookErr").textContent = ""; });
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    // Every step is checked again here, so a submit can never go through with a goal, day or time missing.
    for (const n of [1, 2]) if (!validate(n)) { const msg = $("#bookErr").textContent; goStep(n); $("#bookErr").textContent = msg; return; }
    if (!validate(3)) return;
    const goal = FS.goals.find((g) => g.id === val("goal"));
    const off = +val("day"); const t = val("time");
    const dt = new Date(FS.nowIST().date.getTime() + off * 86400000);
    const dayLabel = `${DOW[dt.getDay()]} ${dt.getDate()} ${MON[dt.getMonth()]}`;
    const win = TIMES.find((x) => x[0] === t);
    const when = `${dayLabel} · ${win ? `${win[1]} (${win[2]})` : FS.fmtTime(t)}`;
    const prog = B.program && FS.program(B.program); const plan = B.plan && FS.plans.find((p) => p.id === B.plan);
    const name = $("#fName").value.trim(); const phone = cleanPhone($("#fPhone").value);
    const ref = `FS-${String(hash(name + phone + off + t) % 9000 + 1000)}`;
    const sum = [["Name", name], ["Mobile", `+91 ${phone.slice(0, 5)} ${phone.slice(5)}`], ["Goal", goal.label], ["When", when]];
    if (prog) sum.push(["Session", prog.name]);
    if (plan) sum.push(["Pass", `${plan.name} · ${FS.money(plan.price)}`]);
    if (B.coach) sum.push(["Coach", B.coach]);
    const note = $("#fNote").value.trim(); if (note) sum.push(["Note", note]);
    $("#doneSum").innerHTML = sum.map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`).join("");
    $("#doneRef").textContent = ref;
    $("#doneTitle").textContent = `You're on the list, ${name.split(" ")[0]}.`;
    const text = [`Hi Fitness Solutions! I'd like to book a free trial.`, ...sum.map(([k, v]) => `${k}: ${v}`), `Ref: ${ref}`].join("\n");
    $("#doneWa").href = FS.wa(text);
    $("#doneIcs").onclick = () => FS.ics({
      title: `${prog ? prog.name + " · " : ""}Free trial — Fitness Solutions`,
      start: FS.istDate(off, win ? win[0] : t), minutes: 60,
      details: `${text}\n\nPhone: ${C.phone} · WhatsApp: ${C.whatsapp}`,
    });
    $("#bookMain").hidden = true; $("#bookDone").hidden = false;
    $("#doneTitle").focus({ preventScroll: true });
  });
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-book]"); if (!b) return;
    let opener = b;
    if (b.closest("#drawer")) { opener = $("#drawer")._opener || b; closeLayer($("#drawer")); }
    if ($("#nav").classList.contains("is-open")) toggleMenu(false);
    openBook({ ...b.dataset }, opener);
  });

  /* =====================================================================
     VIDEOS — load + play only in view
     ===================================================================== */
  const vio = new IntersectionObserver((es) => es.forEach((e) => {
    const v = e.target;
    if (e.isIntersecting) { ensureSrc(v); safePlay(v); } else v.pause();
  }), { rootMargin: "150px 0px", threshold: 0.2 });
  $$("video[data-autoplay]").forEach((v) => vio.observe(v));

  /* =====================================================================
     HERO — the room switches on. One 24 MP photograph, dark until the neon sign and then each hexagon lamp
     light their part of it ("pools" of the lit photo), then the whole room. The camera settles once; then lamps breathe,
     the sign buzzes now and then; the cursor carries a soft torch (mouse) and a tap flares a lamp (touch).
     ===================================================================== */
  const heroSec = $("#top"), stageEl = $("#heroStage"), photo = $("#heroPhoto"), move = $("#heroMove");
  const heroImg = $("#heroImg"), glowsEl = $("#heroGlows"), torch = $("#heroTorch"), dim = $("#heroDim");
  const landscape = window.matchMedia("(min-aspect-ratio: 1/1)");
  // Light sources in each cut of the photo (fractions of the image); rx / ry = how far each pool reaches.
  // The hero is the club's own lit sign (24 MP photo, 4:3). Both layouts use the same 2400x1802 file:
  // "wide" shows it in a panel on the right (headline on dark at the left), "tall" across the top of the screen.
  const HERO_LIGHTS = [
    { x: 0.56, y: 0.27, rx: 0.42, ry: 0.23, sign: true },            // the "Fitness Solutions" letters and figure
    { x: 0.60, y: 0.49, rx: 0.33, ry: 0.10 },                        // the heartbeat line
    { x: 0.09, y: 0.33, rx: 0.10, ry: 0.24 },                        // the sign's glow on the brick pillar
    { x: 0.54, y: 0.74, rx: 0.15, ry: 0.15 }, { x: 0.13, y: 0.70, rx: 0.15, ry: 0.14 }, { x: 0.93, y: 0.74, rx: 0.10, ry: 0.15 }, // the cardio consoles
  ];
  const HERO_SRC = {
    wide: { w: 2400, h: 1802, fp: [0.78, 0.3], lights: HERO_LIGHTS },
    tall: { w: 2400, h: 1802, fp: [0.78, 0.2], lights: HERO_LIGHTS },
  };
  const HERO_KEY = "logo-cardio";
  const HS = { cut: null, url: "", key: "", on: false, litN: 0, timers: [], px: 0, py: 0, tx: 0, ty: 0, drift: 0, raf: 0 };
  // 2400px source: at most ~1.2x on a 2560x1440@1.5 or 4K screen (the panel is as tall as the screen), under 1x on phones
  const heroUrl = () => FS.imgXL(HERO_KEY);
  function buildHero() {
    const cut = landscape.matches ? "wide" : "tall", S = HERO_SRC[cut], url = heroUrl(cut);
    const W = photo.offsetWidth, Hh = photo.offsetHeight, key = `${cut}|${W}|${Hh}|${url}`;
    if (key === HS.key) return; // e.g. a phone's toolbar showing or hiding: nothing to rebuild
    HS.key = key;
    if (url !== HS.url) { HS.url = url; heroImg.src = url; }
    HS.cut = cut;
    move.style.setProperty("--fp", `${S.fp[0] * 100}% ${S.fp[1] * 100}%`);
    const s = Math.max(W / S.w, Hh / S.h), dw = S.w * s, dh = S.h * s, ox = (W - dw) * S.fp[0], oy = (Hh - dh) * S.fp[1];
    $$(".pool", move).forEach((p) => p.remove());
    glowsEl.innerHTML = "";
    S.lights.forEach((L0, i) => {
      const lit = RM || i < HS.litN;
      const cx = ox + L0.x * dw, cy = oy + L0.y * dh, rx = L0.rx * dw, ry = L0.ry * dh;
      const p = document.createElement("div");
      p.className = `pool${L0.sign ? " pool--sign" : ""}${lit ? " is-on" : ""}`;
      Object.assign(p.style, { left: `${cx - rx}px`, top: `${cy - ry}px`, width: `${rx * 2}px`, height: `${ry * 2}px`,
        backgroundImage: `url("${url}")`, backgroundSize: `${dw}px ${dh}px`, backgroundPosition: `${ox - (cx - rx)}px ${oy - (cy - ry)}px` });
      glowsEl.before(p);
      const g = document.createElement("span");
      g.className = `hp__glow${L0.sign ? " hp__glow--sign" : ""}${lit ? " is-on" : ""}`;
      Object.assign(g.style, { left: `${cx}px`, top: `${cy}px`, width: `${rx * 1.5}px`, height: `${rx * 1.5}px` });
      g.style.setProperty("--gd", `${-i * 1.3}s`);
      glowsEl.appendChild(g);
    });
  }
  const sw = $("#lightSwitch");
  function paintSwitch() {
    sw.setAttribute("aria-pressed", String(HS.on)); $(".switch__txt", sw).textContent = HS.on ? "On" : "Off";
    sw.setAttribute("aria-label", HS.on ? "Switch the lights off" : "Switch the lights on");
  }
  const clearHeroT = () => { HS.timers.forEach(clearTimeout); HS.timers = []; };
  // light source n (looked up at call time: the pools are rebuilt when the photo box changes)
  const lightN = (n) => { HS.litN = n + 1; $$(".pool", move)[n]?.classList.add("is-on"); $$(".hp__glow", glowsEl)[n]?.classList.add("is-on"); };
  function heroOn(replay) {
    clearHeroT(); HS.on = true; stageEl.classList.remove("is-off"); stageEl.classList.add("is-powered"); paintSwitch();
    const count = HERO_SRC[HS.cut].lights.length;
    if (RM) { for (let n = 0; n < count; n++) lightN(n); stageEl.classList.add("is-lit"); kTitleEl.classList.add("is-flick"); return; }
    HS.litN = 0; $$(".pool, .hp__glow", stageEl).forEach((e) => e.classList.remove("is-on")); stageEl.classList.remove("is-lit");
    // the neon sign first, then the lamps one by one, then the room
    for (let n = 0; n < count; n++) HS.timers.push(setTimeout(() => lightN(n), 260 + n * 270 + (n ? 380 : 0)));
    HS.timers.push(setTimeout(() => {
      stageEl.classList.add("is-lit"); kTitleEl.classList.add("is-flick");
      if (!replay) HS.timers.push(setTimeout(motionIntro, 1250));
    }, 260 + count * 270 + 520));
  }
  function heroOff() {
    clearHeroT(); HS.on = false; HS.litN = 0; paintSwitch();
    stageEl.classList.remove("is-lit"); stageEl.classList.add("is-off"); kTitleEl.classList.remove("is-flick", "is-breathe");
    $$(".pool, .hp__glow", stageEl).forEach((e) => e.classList.remove("is-on"));
  }
  const kTitleEl = $("#heroTitle");
  sw.addEventListener("click", () => (HS.on ? heroOff() : heroOn(true)));
  buildHero(); paintSwitch();
  let heroRz = 0;
  const reHero = () => { clearTimeout(heroRz); heroRz = setTimeout(buildHero, 120); };
  window.addEventListener("resize", reHero);
  landscape.addEventListener?.("change", reHero);
  // ambient motion only while the hero is on screen
  new IntersectionObserver(([e]) => heroSec.classList.toggle("is-live", e.isIntersecting && !RM)).observe(heroSec);
  // pointer: a soft torch and a little parallax (mouse); a lamp flare where you tap (touch)
  const heroApply = () => { move.style.translate = `${(HS.px * 12).toFixed(2)}px ${(HS.py * 8 + HS.drift).toFixed(2)}px`; };
  function heroMoveFrame() {
    HS.raf = 0; HS.px = lerp(HS.px, HS.tx, 0.1); HS.py = lerp(HS.py, HS.ty, 0.1);
    heroApply();
    if (Math.abs(HS.px - HS.tx) + Math.abs(HS.py - HS.ty) > 0.002) HS.raf = requestAnimationFrame(heroMoveFrame);
  }
  const T0 = { x: 0, y: 0, tx: 0, ty: 0, raf: 0 };
  const torchFrame = () => {
    T0.raf = 0; T0.x = lerp(T0.x, T0.tx, 0.16); T0.y = lerp(T0.y, T0.ty, 0.16);
    torch.style.transform = `translate3d(${T0.x.toFixed(1)}px, ${T0.y.toFixed(1)}px, 0)`;
    if (Math.abs(T0.x - T0.tx) + Math.abs(T0.y - T0.ty) > 0.5) T0.raf = requestAnimationFrame(torchFrame);
  };
  if (!RM) {
    stageEl.addEventListener("pointermove", (e) => {
      if (e.pointerType !== "mouse") return;
      const r = photo.getBoundingClientRect();
      T0.tx = e.clientX - r.left; T0.ty = e.clientY - r.top;
      if (!torch.classList.contains("is-on")) { T0.x = T0.tx; T0.y = T0.ty; torch.classList.add("is-on"); }
      if (!T0.raf) T0.raf = requestAnimationFrame(torchFrame);
      HS.tx = clamp((e.clientX - r.left) / r.width - 0.5, -0.5, 0.5) * 2; HS.ty = clamp((e.clientY - r.top) / r.height - 0.5, -0.5, 0.5) * 2;
      if (!HS.raf) HS.raf = requestAnimationFrame(heroMoveFrame);
    });
    stageEl.addEventListener("pointerleave", () => { torch.classList.remove("is-on"); HS.tx = 0; HS.ty = 0; if (!HS.raf) HS.raf = requestAnimationFrame(heroMoveFrame); });
    stageEl.addEventListener("pointerdown", (e) => {
      if (e.pointerType === "mouse" || e.target.closest("a, button")) return;
      const r = photo.getBoundingClientRect(), f = document.createElement("span");
      f.className = "hp__flare"; f.style.left = `${e.clientX - r.left}px`; f.style.top = `${e.clientY - r.top}px`;
      photo.appendChild(f); setTimeout(() => f.remove(), 950);
    });
  }

  /* =====================================================================
     SCROLL-DRIVEN MOMENTS (sticky + progress)
     ===================================================================== */
  const words = $$(".neon, .manifesto__line");
  const maniImgs = $$("#maniPhotos img");
  let maniIdx = 0;
  function updateManifesto() {
    const line = window.innerHeight * 0.62;
    let lit = -1;
    // read every position first, then write classes (no layout thrash between words)
    const ons = words.map((w) => { const r = w.getBoundingClientRect(); return RM || r.top + r.height * 0.5 < line; });
    words.forEach((w, i) => {
      const on = ons[i];
      if (on !== w.classList.contains("is-lit")) w.classList.toggle("is-lit", on);
      if (on) lit = i;
    });
    const idx = lit >= 5 ? 2 : lit >= 2 ? 1 : 0;
    if (idx !== maniIdx) {
      maniIdx = idx; maniImgs.forEach((im, i) => im.classList.toggle("is-on", i === idx));
      $("#maniCap").textContent = MANI[idx].cap;
    }
  }

  // Elevator
  const rigMQ = window.matchMedia("(min-width: 1024px) and (min-aspect-ratio: 5/4)");
  let rigOn = rigMQ.matches && !RM;
  const stageBox = $("#stage"), track = $("#elevTrack"), panel = $(".panel");
  const E = { cur: -1, want: 0, busy: false, arrived: false };
  // "Look around": a floor's extra stills. Hover previews, click pins, click again (or change floor) returns to the clip.
  const stageStill = $("#stageStill");
  let lookPinned = null;
  function showLook(k) {
    const cap = $("#lookCap");
    $$("#stageInfo .look").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.look === lookPinned)));
    if (!k) { stageStill.classList.remove("is-on"); if (cap) cap.textContent = "Look around"; return; }
    if (stageStill.dataset.k !== k) { stageStill.dataset.k = k; stageStill.src = FS.img(k); stageStill.alt = LOOK[k] || ""; }
    stageStill.hidden = false; void stageStill.offsetWidth; stageStill.classList.add("is-on");
    if (cap) cap.textContent = LOOK[k] || "";
  }
  $("#stageInfo").addEventListener("click", (e) => {
    const b = e.target.closest(".look"); if (!b) return;
    lookPinned = lookPinned === b.dataset.look ? null : b.dataset.look; showLook(lookPinned);
  });
  if (FINE.matches) {
    $("#stageInfo").addEventListener("mouseover", (e) => { const b = e.target.closest(".look"); if (b) showLook(b.dataset.look); });
    $("#stageInfo").addEventListener("mouseout", (e) => { const b = e.target.closest(".look"); if (b && !b.contains(e.relatedTarget)) showLook(lookPinned); });
  }
  // Stacked cards: tap a still to put it on the card, tap again for the clip.
  $("#elevList").addEventListener("click", (e) => {
    const b = e.target.closest(".look"); if (!b) return;
    const card = b.closest(".fcard"), still = $(".fcard__still", card), cap = $(".looks__cap", card);
    const on = b.getAttribute("aria-pressed") !== "true";
    $$(".look", card).forEach((x) => x.setAttribute("aria-pressed", String(on && x === b)));
    if (on) { still.src = FS.img(b.dataset.look); still.alt = LOOK[b.dataset.look] || ""; still.hidden = false; void still.offsetWidth; still.classList.add("is-on"); cap.textContent = LOOK[b.dataset.look] || ""; }
    else { still.classList.remove("is-on"); cap.textContent = "Look around"; }
  });
  function applyFloor(i) {
    E.cur = i;
    const f = FLOORS[i];
    setSeg(f.n); $("#elevName").textContent = f.name;
    lookPinned = null; stageStill.classList.remove("is-on");
    $("#stageInfo").innerHTML = stageInfo(i);
    let num = $(".stage__num", stageBox); if (!num) { num = document.createElement("span"); num.className = "stage__num"; num.setAttribute("aria-hidden", "true"); stageBox.appendChild(num); }
    num.textContent = f.n;
    $$(".fbtn, #elevDir button").forEach((b) => { const on = +b.dataset.floor === i; b.classList.toggle("is-on", on); if (on) b.setAttribute("aria-current", "true"); else b.removeAttribute("aria-current"); });
    $$("#stageMedia video").forEach((v) => { const on = +v.dataset.i === i; v.classList.toggle("is-on", on); if (on) { ensureSrc(v); if (E.arrived) safePlay(v); } else v.pause(); });
  }
  function ding() {
    const d = $("#stageDing"), seam = $("#stageSeam");
    [d, seam].forEach((x) => x.classList.remove("is-on")); stageBox.classList.remove("is-arrive"); void d.offsetWidth;
    [d, seam].forEach((x) => x.classList.add("is-on")); if (!RM) stageBox.classList.add("is-arrive");
  }
  function goFloor(i) {
    E.want = i;
    if (E.busy || i === E.cur) return;
    if (E.cur < 0 || RM) { applyFloor(i); return; }
    E.busy = true;
    panel.classList.add("is-moving"); panel.classList.toggle("is-down", i < E.cur);
    stageBox.classList.add("is-closed");
    setTimeout(() => {
      applyFloor(E.want);
      setTimeout(() => {
        panel.classList.remove("is-moving");
        if (E.arrived) { stageBox.classList.remove("is-closed"); ding(); }
        setTimeout(() => { E.busy = false; if (E.want !== E.cur) goFloor(E.want); }, 360);
      }, 170);
    }, 460);
  }
  function setArrived(on) {
    if (on === E.arrived) return;
    E.arrived = on;
    if (on) { if (!E.busy) { stageBox.classList.remove("is-closed"); ding(); } const v = $("#stageMedia video.is-on"); ensureSrc(v); safePlay(v); }
    else { stageBox.classList.add("is-closed"); $$("#stageMedia video").forEach((v) => v.pause()); }
  }
  function updateRig() {
    if (!rigOn) return;
    const r = track.getBoundingClientRect();
    const total = r.height - window.innerHeight;
    const prog = clamp(-r.top / total, 0, 1);
    $("#elevTravel").style.setProperty("--p", prog.toFixed(3));
    const numEl = $(".stage__num", stageBox); if (numEl && !RM) { const fp = prog * N; numEl.style.setProperty("--fy", (fp - Math.min(N - 1, Math.floor(fp)) - 0.5).toFixed(3)); }
    setArrived(r.top < window.innerHeight * 0.12 && r.bottom > window.innerHeight * 0.5);
    goFloor(Math.min(N - 1, Math.floor(prog * N * 0.9999)));
  }
  applyFloor(0);
  function floorScroll(i) {
    if (rigOn) {
      const r = track.getBoundingClientRect(); const total = r.height - window.innerHeight;
      scrollToY(r.top + window.scrollY + total * ((i + 0.5) / N));
    } else {
      const card = $(`.fcard[data-i="${i}"]`); if (card) scrollToEl(card, -60);
    }
  }
  $("#elevRig").addEventListener("click", (e) => {
    const b = e.target.closest("[data-floor]"); if (!b) return;
    floorScroll(+b.dataset.floor);
  });
  $("#elevDoors").addEventListener("click", () => {
    if (E.busy) return; E.busy = true; stageBox.classList.add("is-closed");
    setTimeout(() => { stageBox.classList.remove("is-closed"); ding(); setTimeout(() => (E.busy = false), 500); }, 700);
  });
  rigMQ.addEventListener?.("change", () => { rigOn = rigMQ.matches && !RM; if (!rigOn) { $$("#stageMedia video").forEach((v) => v.pause()); } onScroll(); });
  // The stage always plays the portrait clips as they were shot, framed per floor (CLIP_POS). On big screens the CSS
  // splits the stage into a directory panel and a picture window, so the footage is shown near its native size.

  // Stacked floor cards: doors open as each card arrives; the mini indicator follows the nearest card.
  const fcards = $$(".fcard");
  const cardIO = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) e.target.classList.add("is-open"); }), { threshold: 0.42 });
  fcards.forEach((c) => cardIO.observe(c));
  let miniI = -1;
  function updateMini() {
    if (rigOn) return;
    const mid = window.innerHeight * 0.55; let best = 0, bd = 1e9;
    fcards.forEach((c, i) => { const r = c.getBoundingClientRect(); const d = Math.abs(r.top + r.height / 2 - mid); if (d < bd) { bd = d; best = i; } });
    if (best !== miniI) { miniI = best; $(".elev__mini-n").textContent = FLOORS[best].n; $(".elev__mini-t").textContent = FLOORS[best].name; }
  }

  // Hero: as it scrolls away the photo drifts (slower than the page) and dims.
  function updateHero() {
    if (RM) return;
    const r = heroSec.getBoundingClientRect();
    const p = clamp(-r.top / Math.max(1, r.height), 0, 1);
    dim.style.opacity = (p * 0.65).toFixed(3);
    const drift = Math.round(clamp(-r.top, 0, r.height) * 0.22 * 2) / 2;
    if (drift !== HS.drift) { HS.drift = drift; heroApply(); }
  }

  const nav = $("#nav");
  let ticking = false;
  let onVel = null; // set by the MOTION block: samples scroll velocity once per scroll frame
  // Only measure the scroll-driven scenes that are on (or near) screen: keeps per-frame work tiny on
  // 144 Hz+ displays. A scene leaving the zone gets one last update so it ends in its final state.
  const near = { hero: true, mani: false, rig: false, cards: false };
  const SCENES = [["hero", heroSec, updateHero], ["mani", $("#manifesto"), updateManifesto], ["rig", track, updateRig], ["cards", fcards[0] && fcards[0].parentElement, updateMini]];
  if ("IntersectionObserver" in window) {
    const sceneIO = new IntersectionObserver((es) => es.forEach((e) => {
      const s = SCENES.find((x) => x[1] === e.target); if (!s) return;
      near[s[0]] = e.isIntersecting; s[2]();
    }), { rootMargin: "60% 0px 60% 0px" });
    SCENES.forEach(([, el]) => el && sceneIO.observe(el));
  } else { Object.keys(near).forEach((k) => (near[k] = true)); }
  function onScroll() {
    ticking = false;
    nav.classList.toggle("is-scrolled", window.scrollY > 24);
    if (near.hero) updateHero();
    if (near.mani) updateManifesto();
    if (near.rig) updateRig();
    if (near.cards) updateMini();
    if (onVel) onVel();
  }
  const requestTick = () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } };
  window.addEventListener("scroll", requestTick, { passive: true });
  window.addEventListener("resize", requestTick);
  onScroll();

  // Active nav link
  const links = $$(".nav__links a");
  // The link for the section crossing mid-screen is lit; in the hero and manifesto none is.
  const secIO = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return;
    const id = "#" + e.target.id;
    links.forEach((a) => a.classList.toggle("is-active", a.getAttribute("href") === id));
  }), { rootMargin: "-45% 0px -50% 0px" });
  ["#top", "#manifesto", "#floors", "#sessions", "#crew", "#passes", "#visit"].forEach((s) => secIO.observe($(s)));
  new IntersectionObserver(([e]) => { inView.board = e.isIntersecting; }).observe($("#sessions"));

  /* ---------- reveals, counters, footer neon ---------- */
  root.classList.add("js-reveal");
  $$(".sec-head .lead, .sec-head .eyebrow, .results__head, .counters, .ratings, .passes__grid, .director, .stories").forEach((el) => el.setAttribute("data-reveal", ""));
  const revIO = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("is-in"); revIO.unobserve(e.target); } }), { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
  $$("[data-reveal], .sec-head").forEach((el) => revIO.observe(el));
  const countIO = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return; countIO.unobserve(e.target);
    $$(".drum", e.target).forEach((d) => d.style.setProperty("--n", d.dataset.n));
  }), { threshold: 0.5 });
  $$(".counter").forEach((c) => countIO.observe(c));
  // Infinite decorative animations only run while their section is on screen.
  const liveIO = new IntersectionObserver((es) => es.forEach((e) => e.target.classList.toggle("is-live", e.isIntersecting)), { rootMargin: "100px 0px" });
  [$("#passes"), $("#marquee")].forEach((el) => liveIO.observe(el));
  // Visit: the neon map draws its route (and lights stops 01-03) once on screen; the pin's loops run only while visible.
  const wmap = $("#wmap");
  if (RM) wmap.classList.add("is-drawn");
  new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) wmap.classList.add("is-drawn");
    wmap.classList.toggle("is-live", e.isIntersecting);
  }), { threshold: 0.35 }).observe(wmap);

  /* =====================================================================
     RAIL — drag, arrows, progress, one video at a time
     ===================================================================== */
  const rail = $("#rail");
  let railDragged = false;
  function railProgress() {
    const max = rail.scrollWidth - rail.clientWidth;
    const bar = $("#railBar"), trackW = bar.parentElement.clientWidth;
    const w = clamp(rail.clientWidth / rail.scrollWidth, 0.08, 1) * trackW;
    bar.style.width = `${w}px`;
    bar.style.setProperty("--x", `${max > 0 ? (rail.scrollLeft / max) * (trackW - w) : 0}px`);
    $("#railHint").textContent = max > 0 && rail.scrollLeft > max - 8 ? "That's the line-up" : "Drag or scroll →";
  }
  rail.addEventListener("scroll", () => requestAnimationFrame(railProgress), { passive: true });
  window.addEventListener("resize", railProgress); railProgress();
  const cardW = () => ($(".pcard", rail)?.getBoundingClientRect().width || 300) + 16;
  $("#railPrev").addEventListener("click", () => rail.scrollBy({ left: -cardW() * 2, behavior: RM ? "auto" : "smooth" }));
  $("#railNext").addEventListener("click", () => rail.scrollBy({ left: cardW() * 2, behavior: RM ? "auto" : "smooth" }));
  rail.addEventListener("keydown", (e) => {
    if (e.target !== rail) return;
    if (e.key === "ArrowRight") { e.preventDefault(); rail.scrollBy({ left: cardW(), behavior: "smooth" }); }
    if (e.key === "ArrowLeft") { e.preventDefault(); rail.scrollBy({ left: -cardW(), behavior: "smooth" }); }
  });
  // mouse drag (touch scrolls natively)
  let drag = null;
  rail.addEventListener("pointerdown", (e) => {
    if (e.pointerType !== "mouse" || e.button !== 0) return;
    drag = { x: e.clientX, left: rail.scrollLeft, moved: false }; railDragged = false;
  });
  window.addEventListener("pointermove", (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.x;
    if (!drag.moved && Math.abs(dx) > 6) { drag.moved = true; rail.classList.add("is-drag"); }
    if (drag.moved) rail.scrollLeft = drag.left - dx;
  });
  window.addEventListener("pointerup", () => {
    if (!drag) return;
    railDragged = drag.moved; drag = null; rail.classList.remove("is-drag");
    setTimeout(() => { railDragged = false; }, 60);
  });
  rail.addEventListener("dragstart", (e) => e.preventDefault());
  const play = (card, on) => {
    const v = $("video", card);
    if (!v) { card.classList.toggle("is-playing", on && !RM); return; } // neon cards: the equaliser runs
    if (on) { ensureSrc(v); safePlay(v); card.classList.add("is-playing"); }
    else { v.pause(); card.classList.remove("is-playing"); }
  };
  const pcards = $$(".pcard", rail);
  if (FINE.matches) {
    pcards.forEach((c) => { c.addEventListener("mouseenter", () => play(c, true)); c.addEventListener("mouseleave", () => play(c, false)); });
  } else if (!RM) {
    // touch: the most visible card in the rail plays, but only while the rail is on screen
    let railOnScreen = false; const ratios = new Map();
    const pick = () => {
      let best = null, br = 0.6;
      if (railOnScreen) ratios.forEach((r, c) => { if (r > br) { br = r; best = c; } });
      pcards.forEach((c) => play(c, c === best));
    };
    new IntersectionObserver(([e]) => { railOnScreen = e.isIntersecting; pick(); }, { threshold: 0.35 }).observe(rail);
    const cio = new IntersectionObserver((es) => { es.forEach((e) => ratios.set(e.target, e.intersectionRatio)); pick(); }, { root: rail, threshold: [0, 0.6, 0.8, 1] });
    pcards.forEach((c) => cio.observe(c));
  }

  /* ---------- crew: floating coaching photo follows the cursor (mouse only) ---------- */
  const fl = $("#crewFloat"), flImg = $("#crewFloatImg");
  const F = { x: 0, y: 0, tx: 0, ty: 0, on: false, raf: 0 };
  const flLoop = () => {
    F.x = lerp(F.x, F.tx, 0.18); F.y = lerp(F.y, F.ty, 0.18);
    fl.style.transform = `translate3d(${F.x}px, ${F.y}px, 0) translate(-50%, -60%) scale(${F.on ? 1 : 0.85}) rotate(${clamp((F.tx - F.x) * 0.05, -8, 8)}deg)`;
    if (F.on || Math.abs(F.tx - F.x) > 0.5) F.raf = requestAnimationFrame(flLoop); else F.raf = 0;
  };
  $("#roster").addEventListener("mousemove", (e) => {
    if (!FINE.matches || window.innerWidth < 1024) return;
    const row = e.target.closest(".crew__row"); if (!row) return;
    F.tx = e.clientX + 120; F.ty = e.clientY;
    const k = row.dataset.img;
    if (flImg.dataset.k !== k) { flImg.dataset.k = k; flImg.src = FS.img(k, true); $("span", fl).textContent = row.dataset.cap || "On the floor"; }
    if (!F.on) { F.on = true; F.x = F.tx; F.y = F.ty; fl.classList.add("is-on"); }
    if (!F.raf) F.raf = requestAnimationFrame(flLoop);
  });
  $("#roster").addEventListener("mouseleave", () => { F.on = false; fl.classList.remove("is-on"); });


  /* =====================================================================
     MOTION — the revamp's moving parts (see "MOTION SYSTEM" in style.css).
     Rules: transform / opacity only; every loop stops when it has nothing to do or is off-screen;
     pointer effects run only while the pointer moves; reduced motion skips all of it.
     ===================================================================== */

  /* ---- entrances: laser sweeps under section heads, staggered rises, image wipes ---- */
  $$(".sec-head").forEach((h) => { if (!$(".sweep", h)) h.insertAdjacentHTML("beforeend", '<i class="sweep" aria-hidden="true"></i>'); });
  ["#counters", "#ratings", "#passGrid", "#hours", ".stories", "#wayIn"].forEach((sel) => {
    const el = $(sel); if (!el) return;
    el.removeAttribute("data-reveal"); el.setAttribute("data-stagger", "");
    [...el.children].forEach((c, i) => c.style.setProperty("--si", i));
    revIO.observe(el);
  });
  $$(".wayin__step, .story").forEach((st, i) => {
    const pic = $(".wayin__img, .story__img", st); if (!pic) return;
    pic.classList.add("wipe"); st.setAttribute("data-wipe", ""); if (!st.style.getPropertyValue("--si")) st.style.setProperty("--si", i % 3);
    revIO.observe(st);
  });
  revIO.observe($("#plates"));
  liveIO.observe($("#sessions")); liveIO.observe($("#manifesto"));

  /* ---- footer: LIGHTS ON. letter by letter, then a surge ---- */
  const fw = $("#footWord");
  const tubes = (str, c, off) => [...str].map((ch, i) => `<span class="fl" data-c="${ch}" style="--i:${i + off};--c:${c}">${ch}</span>`).join("");
  fw.innerHTML = `<span class="fw">${tubes("Lights", "var(--violet)", 0)}</span> <span class="fw fw--on">${tubes("on.", "var(--yellow)", 6)}</span>`;
  let surgeT = 0;
  new IntersectionObserver(([e]) => {
    fw.classList.toggle("is-lit", e.isIntersecting); clearTimeout(surgeT); fw.classList.remove("is-surge");
    if (e.isIntersecting && !RM) surgeT = setTimeout(() => fw.classList.add("is-surge"), 9 * 110 + 900);
  }, { threshold: 0.5 }).observe(fw);

  /* ---- neon ribbons: two bands of slogans per block, drifting at a steady pace in opposite directions ---- */
  const RIB = [
    { a: [["Lift", "var(--violet)"], ["Sweat", "var(--pink)"], ["Repeat", "var(--yellow)"], ["Consistency", "var(--violet)"], ["Discipline", "#CFC2FF"], ["Train hard", "var(--pink)"]],
      b: ["Since 2009", "Four floors", "80+ stations", "Laxman Chowk", "Dehradun", "Lights on"] },
    { a: [["Train hard", "var(--pink)"], ["Consistency", "var(--violet)"], ["Discipline", "#CFC2FF"], ["Lift", "var(--yellow)"], ["Sweat", "var(--pink)"], ["Repeat", "var(--violet)"]],
      b: ["Find the lights", "Malviya Road", "Laxman Chowk", "Dehradun", "Since 2009"] },
  ];
  const ribbons = [];
  $$(".ribbons").forEach((box, bi) => {
    const def = RIB[bi] || RIB[0];
    const [ta, tb] = $$(".ribbon__track", box);
    const segA = def.a.map(([w, c]) => `<span class="ribbon__w" style="--c:${c}">${w}</span><i class="ribbon__hex"></i>`).join("");
    const segB = def.b.map((w) => `<span class="ribbon__w">${w}</span><i class="ribbon__hex"></i>`).join("");
    ta.innerHTML = segA.repeat(6); tb.innerHTML = segB.repeat(6); // 6 copies: the loop shifts by half (3 copies), so it is seamless
    if (RM || !ta.animate) return;
    // Start 1000 loops in: a reversed (negative-rate) infinite animation can only play() from a time above 0.
    const mk = (t, dir, dur) => { const an = t.animate([{ transform: "translateX(0)" }, { transform: "translateX(-50%)" }], { duration: dur, iterations: Infinity, direction: dir }); an.pause(); an.currentTime = dur * 1000; return an; };
    const rb = { anims: [mk(ta, "normal", 48000), mk(tb, "reverse", 56000)], on: false, rate: 1 };
    ribbons.push(rb);
    const run = (an) => { try { an.play(); } catch (e) { an.updatePlaybackRate(Math.abs(an.playbackRate) || 1); an.play(); } };
    new IntersectionObserver(([e]) => { rb.on = e.isIntersecting; rb.anims.forEach((an) => (rb.on ? run(an) : an.pause())); }, { rootMargin: "120px 0px" }).observe(box);
  });

  /* ---- scroll velocity: drives the ribbons, the reviews marquee and the lean of outlined heading lines ---- */
  const VEL = { y: window.scrollY, t: performance.now(), v: 0, last: 0, raf: 0, dir: 1 };
  const leaners = new Set();
  let mqAnims = null;
  if (!RM) {
    const leanIO = new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting) leaners.add(e.target); else { leaners.delete(e.target); e.target.style.transform = ""; }
    }));
    $$(".h2 .soft").forEach((el) => leanIO.observe(el));
  }
  // Bands, the reviews marquee and heading lines keep a steady pace: changing their speed (or skew) every frame
  // while scrolling read as stutter on high-refresh screens, so scroll speed no longer drives them.
  function applyVel() {
    return;
    // eslint-disable-next-line no-unreachable
    const mag = Math.min(5, Math.abs(VEL.v) * 2.6), r = (1 + mag) * VEL.dir;
    for (const rb of ribbons) if (rb.on && Math.abs(rb.rate - r) > 0.02) { rb.rate = r; rb.anims.forEach((an) => an.updatePlaybackRate(r)); }
    const sk = clamp(-VEL.v * 3.2, -7, 7);
    leaners.forEach((el) => { el.style.transform = Math.abs(sk) < 0.06 ? "" : `skewX(${sk.toFixed(2)}deg)`; });
    const mq = $("#marquee");
    if (mq.classList.contains("is-live")) {
      if (!mqAnims) mqAnims = $$(".mq__track").flatMap((t) => (t.getAnimations ? t.getAnimations() : []));
      const mr = 1 + mag * 0.6; mqAnims.forEach((an) => { if (Math.abs(an.playbackRate - mr) > 0.02) an.updatePlaybackRate(mr); });
    }
  }
  function velDecay(now) {
    VEL.raf = 0;
    if (now - VEL.last > 40) { VEL.v *= 0.82; VEL.t = now; VEL.y = window.scrollY; applyVel(); }
    if (Math.abs(VEL.v) > 0.004) VEL.raf = requestAnimationFrame(velDecay);
    else { VEL.v = 0; applyVel(); }
  }
  if (!RM) onVel = () => {
    const now = performance.now(), y = window.scrollY, dt = Math.max(8, now - VEL.t);
    const inst = clamp((y - VEL.y) / dt, -12, 12);
    VEL.v = lerp(VEL.v, inst, 0.4); VEL.y = y; VEL.t = now; VEL.last = now;
    if (Math.abs(inst) > 0.05) VEL.dir = inst < 0 ? -1 : 1;
    applyVel();
    if (!VEL.raf) VEL.raf = requestAnimationFrame(velDecay);
  };

  /* ---- hero: kinetic type — letters widen toward the cursor (mouse); breathe once on touch ---- */
  const kTitle = $("#heroTitle"), kChars = $$(".ch", kTitle);
  const K = { act: false, x: 0, y: 0, raf: 0, c: [], R: 200, ready: false, dirty: true };
  function kMeasure() {
    const sr = stageEl.getBoundingClientRect();
    K.R = parseFloat(getComputedStyle(kTitle).fontSize) * 1.1;
    K.c = kChars.map((c) => { const r = c.getBoundingClientRect(); return { x: r.left + r.width / 2 - sr.left, y: r.top + r.height / 2 - sr.top, s: 64 }; });
    K.dirty = false;
  }
  function kFrame() {
    K.raf = 0;
    kChars.forEach((c, i) => {
      const m = K.c[i]; if (!m) return;
      const d = K.act ? Math.hypot(K.x - m.x, (K.y - m.y) * 1.25) : 1e9;
      const k = clamp(1 - d / K.R, 0, 1), s = Math.round(64 + 38 * k * k * (3 - 2 * k));
      if (s !== m.s) { m.s = s; c.style.fontStretch = s === 64 ? "" : `${s}%`; }
    });
  }
  function motionIntro() {
    if (RM || K.ready) return;
    K.ready = true; kTitle.classList.add("is-kinetic");
    if (!FINE.matches) kTitle.classList.add("is-breathe");
  }
  if (FINE.matches && !RM) {
    stageEl.addEventListener("pointermove", (e) => {
      if (!K.ready || e.pointerType !== "mouse") return;
      if (K.dirty && !K.act) kMeasure();
      const r = stageEl.getBoundingClientRect(); K.x = e.clientX - r.left; K.y = e.clientY - r.top; K.act = true;
      if (!K.raf) K.raf = requestAnimationFrame(kFrame);
    });
    stageEl.addEventListener("pointerleave", () => { K.act = false; if (!K.raf) K.raf = requestAnimationFrame(kFrame); });
    window.addEventListener("resize", () => { K.dirty = true; });
  }

  /* ---- programme cards: 3D tilt with a glare that follows the cursor ---- */
  if (FINE.matches && !RM) {
    const T = { c: null, r: null, x: 0, y: 0, raf: 0 };
    const tReset = () => { if (!T.c) return; T.c.classList.remove("is-tilt"); T.c.style.transform = ""; T.c = null; T.r = null; };
    const tFrame = () => {
      T.raf = 0; const c = T.c; if (!c) return;
      if (!T.r) T.r = c.getBoundingClientRect();
      const x = clamp((T.x - T.r.left) / T.r.width, 0, 1), y = clamp((T.y - T.r.top) / T.r.height, 0, 1);
      c.style.transform = `perspective(1100px) rotateX(${((0.5 - y) * 9).toFixed(2)}deg) rotateY(${((x - 0.5) * 12).toFixed(2)}deg) translateY(-6px) scale(1.015)`;
      c.style.setProperty("--gx", `${(x * 100).toFixed(1)}%`); c.style.setProperty("--gy", `${(y * 100).toFixed(1)}%`);
    };
    rail.addEventListener("pointermove", (e) => {
      if (e.pointerType !== "mouse" || rail.classList.contains("is-drag")) { tReset(); return; }
      const c = e.target.closest(".pcard");
      if (c !== T.c) { tReset(); if (!c) return; T.c = c; T.r = null; c.classList.add("is-tilt"); }
      T.x = e.clientX; T.y = e.clientY; if (!T.raf) T.raf = requestAnimationFrame(tFrame);
    });
    rail.addEventListener("pointerleave", tReset);
    rail.addEventListener("scroll", () => { T.r = null; }, { passive: true });
    window.addEventListener("scroll", () => { T.r = null; }, { passive: true });
  }

  /* ---- elevator: depth parallax — panel, picture and numeral drift at different depths (mouse, pinned rig only) ---- */
  if (FINE.matches && !RM) {
    const rigEl = $("#elevRig"), media = $("#stageMedia");
    const P = { x: 0, y: 0, tx: 0, ty: 0, raf: 0, r: null };
    const pFrame = () => {
      P.raf = 0; P.x = lerp(P.x, P.tx, 0.12); P.y = lerp(P.y, P.ty, 0.12);
      media.style.setProperty("--sx", `${(P.x * 14).toFixed(2)}px`); media.style.setProperty("--sy", `${(P.y * 9).toFixed(2)}px`);
      panel.style.setProperty("--qx", `${(-P.x * 6).toFixed(2)}px`); panel.style.setProperty("--qy", `${(-P.y * 4).toFixed(2)}px`);
      const num = $(".stage__num", stageBox);
      if (num) { num.style.setProperty("--mx", `${(P.x * 26).toFixed(2)}px`); num.style.setProperty("--my", `${(P.y * 16).toFixed(2)}px`); }
      if (Math.abs(P.x - P.tx) + Math.abs(P.y - P.ty) > 0.003) P.raf = requestAnimationFrame(pFrame);
    };
    rigEl.addEventListener("pointermove", (e) => {
      if (!rigOn || e.pointerType !== "mouse") return;
      const r = rigEl.getBoundingClientRect();
      P.tx = clamp(((e.clientX - r.left) / r.width - 0.5) * 2, -1, 1); P.ty = clamp(((e.clientY - r.top) / r.height - 0.5) * 2, -1, 1);
      if (!P.raf) P.raf = requestAnimationFrame(pFrame);
    });
    rigEl.addEventListener("pointerleave", () => { P.tx = 0; P.ty = 0; if (!P.raf) P.raf = requestAnimationFrame(pFrame); });
  }

  /* ---- pointer: a neon halo trails the cursor; yellow buttons are magnetic ---- */
  if (FINE.matches && !RM) {
    const halo = document.createElement("div"); halo.className = "halo"; halo.setAttribute("aria-hidden", "true"); halo.innerHTML = "<i></i>";
    document.body.appendChild(halo);
    const H = { x: 0, y: 0, tx: 0, ty: 0, raf: 0 };
    const hFrame = () => {
      H.raf = 0; H.x = lerp(H.x, H.tx, 0.3); H.y = lerp(H.y, H.ty, 0.3);
      halo.style.transform = `translate3d(${H.x.toFixed(1)}px, ${H.y.toFixed(1)}px, 0)`;
      if (Math.abs(H.x - H.tx) + Math.abs(H.y - H.ty) > 0.4) H.raf = requestAnimationFrame(hFrame);
    };
    const HOT = "a, button, [role='tab'], [role='radio'], .pcard, .look, label, input, textarea, select";
    const MAG = ".btn--yellow, .iconbtn, .switch";
    const mags = new Map(); let mRaf = 0;
    const mLoop = () => {
      mRaf = 0; let busy = false;
      mags.forEach((m, el) => {
        m.x = lerp(m.x, m.tx, 0.2); m.y = lerp(m.y, m.ty, 0.2);
        const done = Math.abs(m.x - m.tx) + Math.abs(m.y - m.ty) < 0.05;
        if (done && !m.tx && !m.ty) { el.style.translate = ""; mags.delete(el); return; }
        el.style.translate = `${m.x.toFixed(2)}px ${m.y.toFixed(2)}px`; if (!done) busy = true;
      });
      if (busy) mRaf = requestAnimationFrame(mLoop);
    };
    document.addEventListener("pointermove", (e) => {
      if (e.pointerType !== "mouse") return;
      H.tx = e.clientX; H.ty = e.clientY;
      if (!halo.classList.contains("is-on")) { H.x = H.tx; H.y = H.ty; halo.classList.add("is-on"); }
      if (!H.raf) H.raf = requestAnimationFrame(hFrame);
      const el = e.target.closest ? e.target.closest(MAG) : null;
      mags.forEach((m, k) => { if (k !== el) { m.tx = 0; m.ty = 0; } });
      if (el && !el.disabled) {
        const m = mags.get(el) || { x: 0, y: 0, tx: 0, ty: 0 }; const r = el.getBoundingClientRect();
        m.tx = clamp((e.clientX - (r.left - m.x + r.width / 2)) * 0.22, -8, 8); m.ty = clamp((e.clientY - (r.top - m.y + r.height / 2)) * 0.32, -6, 6);
        mags.set(el, m);
      }
      if (mags.size && !mRaf) mRaf = requestAnimationFrame(mLoop);
    }, { passive: true });
    document.addEventListener("pointerover", (e) => halo.classList.toggle("is-hot", !!(e.target.closest && e.target.closest(HOT))));
    document.addEventListener("pointerdown", () => halo.classList.add("is-down"));
    document.addEventListener("pointerup", () => halo.classList.remove("is-down"));
    document.addEventListener("mouseout", (e) => { if (!e.relatedTarget || e.relatedTarget.tagName === "IFRAME") halo.classList.remove("is-on"); });
  }

  /* ---- touch: a ripple of light where you tap ---- */
  if (!FINE.matches && !RM) {
    const TAPS = ".btn, .chip, .day, .fbtn, .row__btn, .pcard__more, .seg-toggle button, .iconbtn, .crew__btn, .look, .rating, .story, .switch";
    document.addEventListener("pointerdown", (e) => {
      if (e.pointerType === "mouse") return;
      const el = e.target.closest && e.target.closest(TAPS); if (!el) return;
      el.classList.add("tapfx");
      const r = el.getBoundingClientRect(), t = document.createElement("span");
      t.className = "tap"; t.style.setProperty("--x", `${e.clientX - r.left}px`); t.style.setProperty("--y", `${e.clientY - r.top}px`);
      el.appendChild(t); setTimeout(() => t.remove(), 700);
    }, { passive: true });
  }

  /* ---- timetable: the board warms up (digits spin) the first time it comes into view ---- */
  if (!RM) {
    const warm = new IntersectionObserver(([e]) => { if (e.isIntersecting) { warm.disconnect(); cycleFlaps($("#rows")); } }, { threshold: 0.3 });
    warm.observe($("#rows"));
  }

  /* =====================================================================
     LOADER + INTRO
     ===================================================================== */
  const loader = $("#loader");
  function startIntro() {
    document.body.classList.add("is-ready");
    // switch on once the photo is decoded (or after 2.5 s regardless)
    Promise.race([heroImg.decode().catch(() => {}), new Promise((r) => setTimeout(r, 2500))]).then(() => heroOn(false));
  }
  // split hero words into characters for the width-axis entrance
  $$(".split").forEach((el) => { el.innerHTML = [...el.textContent].map((c, i) => `<span class="ch" style="--i:${i + (el.classList.contains("on-word") ? 6 : 0)}">${c}</span>`).join(""); });
  if (RM || root.classList.contains("intro-seen") || !loader) {
    if (loader) loader.remove();
    requestAnimationFrame(startIntro);
  } else {
    const svg = $("#loaderHex"); const r = 22, dist = Math.sqrt(3) * r * 1.08;
    const centres = [[0, 0], ...[30, 90, 150, 210, 270, 330].map((a) => [dist * Math.cos((a * Math.PI) / 180), dist * Math.sin((a * Math.PI) / 180)])];
    svg.innerHTML = centres.map(([x, y]) => `<path d="${[0, 1, 2, 3, 4, 5].map((k) => `${k ? "L" : "M"}${(x + r * 0.92 * Math.cos((k * Math.PI) / 3)).toFixed(2)} ${(y + r * 0.92 * Math.sin((k * Math.PI) / 3)).toFixed(2)}`).join(" ")} Z"/>`).join("");
    const paths = $$("path", svg);
    const order = [0, 3, 1, 5, 2, 6, 4];
    order.forEach((pi, k) => setTimeout(() => paths[pi].classList.add("is-on"), 140 + k * 125 + Math.random() * 60));
    const clock = $("#loaderClock"); const seq = ["05:29:57", "05:29:58", "05:29:59", "05:30:00"];
    seq.forEach((t, i) => setTimeout(() => { clock.textContent = t; }, i * 330));
    setTimeout(() => loader.classList.add("is-full"), 1100);
    setTimeout(() => {
      loader.classList.add("is-done"); startIntro();
      setTimeout(() => loader.remove(), 900);
    }, 1750);
  }
})();
