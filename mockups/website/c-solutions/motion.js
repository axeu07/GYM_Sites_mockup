/* Direction C — motion system.
   One small module for the generic, story-agnostic motion: velocity-reactive marquees, cursor spotlight + tilt,
   magnetic buttons, the sliding nav glider, a scroll-progress line, word-by-word heading reveals, footer letters,
   ambient "liveness" gating (ambient CSS animations only run while their section is on screen), and confetti.
   Rules: transform / opacity / CSS variables only; no layout reads inside per-frame loops (geometry is cached and
   re-measured on resize); every loop stops when off-screen, when the tab is hidden, or when it has settled.
   main.js calls FSMotion.init() once the page content has been rendered. */
(() => {
  const doc = document.documentElement;
  const RM = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const FINE = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const IO = "IntersectionObserver" in window;

  /* ---------- ambient liveness: [data-live] sections get .is-live while (nearly) on screen ---------- */
  function liveness() {
    const els = $$("[data-live]");
    if (!IO) { els.forEach((e) => e.classList.add("is-live")); return; }
    const io = new IntersectionObserver((es) => es.forEach((e) => e.target.classList.toggle("is-live", e.isIntersecting)), { rootMargin: "8% 0px 8% 0px" });
    els.forEach((e) => io.observe(e));
  }

  /* ---------- scroll velocity (sampled per frame by whoever needs it; no scroll listener) ---------- */
  const vel = { y: window.scrollY, t: performance.now(), v: 0, at: -1 };
  function sampleVelocity(now) {
    if (now === vel.at) return vel.v;                    // several tapes in one frame share one sample
    vel.at = now;
    const y = window.scrollY, dt = Math.max(1, now - vel.t);
    const inst = (y - vel.y) / dt;                       // px per ms
    vel.v += (inst - vel.v) * (1 - Math.exp(-dt / 90));  // smoothed
    vel.y = y; vel.t = now;
    return vel.v;
  }

  /* ---------- velocity-reactive marquee ----------
     The track holds two identical halves, so one loop is translateX(0 → -50%). That drift is a Web Animation, which
     runs on the compositor: a tape sitting on screen costs the main thread nothing. Script only wakes while you
     scroll (or hover): scroll speed raises the playback rate, the drift follows the direction you last scrolled
     (times the tape's own direction), and the tape skews a little with velocity (written to the tape's `transform`;
     its tilt lives in the `rotate` property). Then it settles and stops again. */
  function marquee(track, { speed = 46, dir = -1, maxBoost = 900, skew = 5, hoverPause = true } = {}) {
    if (!track || RM || !track.animate) return;           // no WAAPI: the CSS keyframe fallback keeps the tape moving
    const host = track.parentElement;
    const LOOPS = 400;                                    // start deep in the timeline so a reversed rate never hits 0
    const anim = track.animate([{ transform: "translate3d(0,0,0)" }, { transform: "translate3d(-50%,0,0)" }], { duration: 60000, iterations: Infinity });
    anim.pause();
    let dur = 0, running = false, visible = false, last = 0, sdir = 1, s = 0, k = 1, kT = 1, rate = NaN, sk = "";
    const measure = () => {
      const half = track.scrollWidth / 2; if (!(half > 0)) return;
      const nd = (half / speed) * 1000; if (Math.abs(nd - dur) < 1) return;
      const prog = dur ? ((anim.currentTime || 0) % dur) / dur : 0;   // keep the tape where it is across a resize
      dur = nd; anim.effect.updateTiming({ duration: dur }); anim.currentTime = (LOOPS + prog) * dur;
    };
    measure();
    if ("ResizeObserver" in window) new ResizeObserver(measure).observe(track);
    const setRate = (r) => { if (Math.abs(r - rate) < 0.004) return; rate = r; anim.updatePlaybackRate(r); };
    const sync = () => {                                  // play only while on screen, visible and moving
      const want = visible && !document.hidden && k > 0;
      if (want && anim.playState !== "running") anim.play(); else if (!want && anim.playState === "running") anim.pause();
    };
    setRate(-dir);
    // Pointer over the tape, or keyboard focus inside it: glide to a stop so a goal is easy to pick.
    let hov = false, foc = false;
    const target = () => { kT = hov || foc ? 0 : 1; start(); };
    if (hoverPause && FINE) {
      host.addEventListener("pointerenter", () => { hov = true; target(); });
      host.addEventListener("pointerleave", () => { hov = false; target(); });
    }
    host.addEventListener("focusin", () => { foc = true; target(); });
    host.addEventListener("focusout", () => { foc = false; target(); });
    // Steady drift: the tape's speed and direction never change with scrolling (rate changes every frame read as
    // stutter on high-refresh screens). Script only runs for the short ease in and out of a hover/focus pause.
    const frame = (now) => {
      if (!visible || document.hidden) { running = false; sync(); return; }
      const dt = Math.min(64, now - (last || now)); last = now;
      k += (kT - k) * (1 - Math.exp(-dt / 220));
      if (kT === 0 && k < 0.02) k = 0;                    // held: come to a real stop
      if (kT === 1 && k > 0.995) k = 1;
      setRate(-dir * k); sync();
      if (k === kT) { running = false; return; }          // settled: back to compositor-only
      requestAnimationFrame(frame);
    };
    const start = () => {
      if (running || !visible || document.hidden) { sync(); return; }
      if (k === kT) { sync(); return; }                   // nothing to ease: let the compositor carry on
      running = true; last = 0;
      requestAnimationFrame(frame);
    };
    if (IO) new IntersectionObserver((es) => { visible = es[0].isIntersecting; start(); }, { rootMargin: "60px 0px" }).observe(host);
    else { visible = true; start(); }
    document.addEventListener("visibilitychange", start);
    track.classList.add("is-js");
  }

  /* ---------- cursor spotlight (+ tilt on .spot--tilt) ---------- */
  function spotlight() {
    if (RM) return;
    if (!FINE) { sheen(); return; }
    let pend = null, cur = null;
    const apply = () => {
      const e = pend; pend = null; if (!e) return;
      const el = e.target.closest && e.target.closest(".spot");
      if (cur && cur !== el) reset(cur);
      cur = el; if (!el) return;
      const r = el.getBoundingClientRect();
      const px = e.clientX - r.left, py = e.clientY - r.top;
      el.style.setProperty("--sx", px.toFixed(1) + "px"); el.style.setProperty("--sy", py.toFixed(1) + "px");
      el.classList.add("is-spot");
      if (el.classList.contains("spot--tilt")) {
        const nx = px / r.width - 0.5, ny = py / r.height - 0.5;
        el.style.setProperty("--ry", (nx * 7).toFixed(2) + "deg"); el.style.setProperty("--rx", (-ny * 6).toFixed(2) + "deg");
      }
    };
    const reset = (el) => { el.classList.remove("is-spot"); el.style.setProperty("--rx", "0deg"); el.style.setProperty("--ry", "0deg"); };
    document.addEventListener("pointermove", (e) => { if (e.pointerType !== "mouse") return; const first = !pend; pend = e; if (first) requestAnimationFrame(apply); }, { passive: true });
    document.addEventListener("pointerout", (e) => { if (cur && !cur.contains(e.relatedTarget)) { reset(cur); cur = null; } }, { passive: true });
  }
  // Touch screens: the same light sweeps across each card once as it arrives.
  function sheen() {
    if (!IO) return;
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("sheen"); io.unobserve(e.target); } }), { threshold: 0.55 });
    $$(".spot").forEach((el) => io.observe(el));
  }

  /* ---------- magnetic buttons ---------- */
  function magnetic() {
    if (RM || !FINE) return;
    let pend = null, cur = null;
    const apply = () => {
      const e = pend; pend = null; if (!e) return;
      const el = e.target.closest && e.target.closest(".mag");
      if (cur && cur !== el) release(cur);
      cur = el; if (!el) return;
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
      el.style.setProperty("--mx", clamp(dx * 0.22, -9, 9).toFixed(1) + "px");
      el.style.setProperty("--my", clamp(dy * 0.32, -7, 7).toFixed(1) + "px");
    };
    const release = (el) => { el.style.setProperty("--mx", "0px"); el.style.setProperty("--my", "0px"); };
    document.addEventListener("pointermove", (e) => { if (e.pointerType !== "mouse") return; const first = !pend; pend = e; if (first) requestAnimationFrame(apply); }, { passive: true });
    document.addEventListener("pointerout", (e) => { if (cur && !cur.contains(e.relatedTarget)) { release(cur); cur = null; } }, { passive: true });
  }

  /* ---------- nav glider: one ink pill slides to the active (or hovered) link ---------- */
  function glider() {
    const links = $(".nav__links"); if (!links) return;
    const g = document.createElement("span"); g.className = "nav__glider"; g.setAttribute("aria-hidden", "true");
    links.prepend(g); links.classList.add("has-glider");
    const as = $$("a", links);
    let hover = null;
    const place = () => {
      const t = hover || as.find((a) => a.classList.contains("is-active"));
      as.forEach((a) => { if (a.classList.contains("is-glide") !== (a === t)) a.classList.toggle("is-glide", a === t); });
      if (!t) { g.style.opacity = "0"; return; }
      g.style.opacity = "1";
      g.style.width = t.offsetWidth + "px";
      g.style.transform = `translate3d(${t.offsetLeft}px,0,0)`;
      links.classList.toggle("is-hovering", !!hover && !hover.classList.contains("is-active"));
    };
    if (FINE) {
      as.forEach((a) => a.addEventListener("pointerenter", () => { hover = a; place(); }));
      links.addEventListener("pointerleave", () => { hover = null; place(); });
    }
    // re-place when main.js moves the active section (class changes on the links; place() only writes when something changed)
    const mo = new MutationObserver(place);
    as.forEach((a) => mo.observe(a, { attributes: true, attributeFilter: ["class"] }));
    window.addEventListener("resize", place);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(place);
    place();
  }

  /* ---------- scroll progress line under the nav ---------- */
  function progress() {
    const bar = $("#navProgress"); if (!bar) return;
    // style.css drives the bar from a scroll timeline on the compositor where supported; this is the fallback
    if (window.CSS && CSS.supports && CSS.supports("animation-timeline: scroll()")) return;
    let max = 1, queued = false;
    const measure = () => { max = Math.max(1, doc.scrollHeight - window.innerHeight); paint(); };
    const paint = () => { queued = false; bar.style.transform = `scaleX(${clamp(window.scrollY / max, 0, 1).toFixed(4)})`; };
    window.addEventListener("scroll", () => { if (!queued) { queued = true; requestAnimationFrame(paint); } }, { passive: true });
    window.addEventListener("resize", measure);
    if ("ResizeObserver" in window) new ResizeObserver(measure).observe(document.body);
    measure();
  }

  /* ---------- word-by-word heading reveal ---------- */
  function splitWords(el) {
    if (el.dataset.split) return; el.dataset.split = "1";
    let i = 0;
    const walk = (node) => {
      [...node.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          const parts = n.textContent.split(/(\s+)/);
          const frag = document.createDocumentFragment();
          parts.forEach((p) => {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(p)); return; }
            const w = document.createElement("span"); w.className = "w";
            const inner = document.createElement("span"); inner.textContent = p; inner.style.setProperty("--wi", i++);
            w.appendChild(inner); frag.appendChild(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && !n.classList.contains("hl")) walk(n);
        else if (n.nodeType === 1) { // keep a highlighted phrase as one unit so the yellow sweep stays continuous
          const w = document.createElement("span"); w.className = "w";
          const inner = document.createElement("span"); inner.style.setProperty("--wi", i++);
          n.replaceWith(w); inner.appendChild(n); w.appendChild(inner);
        }
      });
    };
    walk(el);
    el.classList.add("split");
  }
  function headings() {
    const hs = $$(".h2, .foot__big");
    if (RM) return;
    hs.forEach(splitWords);
    if (!IO) { hs.forEach((h) => h.classList.add("is-in")); return; }
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } }), { threshold: 0.35 });
    hs.forEach((h) => io.observe(h));
  }

  /* ---------- hero pointer parallax for the gradient mesh ---------- */
  function heroParallax() {
    const hero = $(".hero"), mesh = $(".hero__mesh");
    if (!hero || !mesh || RM || !FINE) return;
    let pend = null, r = null;
    const apply = () => {
      const e = pend; pend = null; if (!e || !r) return;
      const nx = (e.clientX - r.left) / r.width - 0.5, ny = (e.clientY - r.top) / r.height - 0.5;
      mesh.style.setProperty("--px", (nx * 36).toFixed(1) + "px"); mesh.style.setProperty("--py", (ny * 28).toFixed(1) + "px");
    };
    hero.addEventListener("pointerenter", () => { r = hero.getBoundingClientRect(); });
    hero.addEventListener("pointermove", (e) => { if (!r) r = hero.getBoundingClientRect(); const first = !pend; pend = e; if (first) requestAnimationFrame(apply); }, { passive: true });
    hero.addEventListener("pointerleave", () => { mesh.style.setProperty("--px", "0px"); mesh.style.setProperty("--py", "0px"); r = null; });
    window.addEventListener("scroll", () => { r = null; }, { passive: true });
  }

  /* ---------- confetti: small yellow / violet / ink chips from an element ---------- */
  function confetti(from, n = 30) {
    if (RM || !from) return;
    const r = from.getBoundingClientRect();
    const box = document.createElement("div"); box.className = "confetti"; box.setAttribute("aria-hidden", "true");
    // the box is absolute in <body>, so convert viewport coords to page coords
    box.style.left = r.left + r.width / 2 + scrollX + "px"; box.style.top = r.top + r.height / 2 + scrollY + "px";
    const C = ["#FFE21A", "#6B3CF6", "#0E0F13", "#FFE21A", "#9A7BFF", "#12A150"];
    let html = "";
    for (let i = 0; i < n; i++) {
      const a = (Math.random() * 1.2 - 0.6) * Math.PI - Math.PI / 2, d = 120 + Math.random() * 190;
      html += `<i style="--dx:${(Math.cos(a) * d).toFixed(0)}px;--dy:${(Math.sin(a) * d).toFixed(0)}px;--fall:${(140 + Math.random() * 200).toFixed(0)}px;--r:${(Math.random() * 720 - 360).toFixed(0)}deg;--c:${C[i % C.length]};--w:${(6 + Math.random() * 6).toFixed(1)}px;--h:${(8 + Math.random() * 9).toFixed(1)}px;--t:${(1000 + Math.random() * 600).toFixed(0)}ms;--dl:${(Math.random() * 90).toFixed(0)}ms"></i>`;
    }
    box.innerHTML = html; document.body.appendChild(box);
    setTimeout(() => box.remove(), 2000);
  }

  function init() {
    liveness();
    $$(".marquee__track").forEach((t) => marquee(t, { dir: +(t.dataset.dir || -1), speed: +(t.dataset.speed || 46) }));
    spotlight(); magnetic(); glider(); progress(); headings(); heroParallax();
  }

  window.FSMotion = { init, confetti, RM, FINE };
})();
