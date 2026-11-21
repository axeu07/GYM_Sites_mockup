// Scroll-jitter probe for big, high-refresh screens.
// Emulates an uncapped-refresh display (rAF not limited to 60 fps) at a large viewport, replays a wheel gesture,
// then records every frame for ~1.6 s after the input stops. A "shake" = something on screen reversing direction
// while the page is settling. Reports: frame pacing, scroll reversals, settle time, and the worst-offending elements.
// Usage: node qa/jitter.mjs [page-substring] [--w=2560 --h=1440 --dpr=1.5 --gesture=wheel|trackpad|both --at=0.15,0.45,0.75]
import { chromium } from "playwright";
import { PAGES, urlFor } from "./pages.mjs";

const args = process.argv.slice(2);
const opt = Object.fromEntries(args.filter((a) => a.startsWith("--")).map((a) => a.slice(2).split("=")));
const only = args.find((a) => !a.startsWith("--"));
const W = +(opt.w || 2560), H = +(opt.h || 1440), DPR = +(opt.dpr || 1.5);
const gestures = (opt.gesture || "both") === "both" ? ["wheel", "trackpad"] : [opt.gesture];
const spots = (opt.at || "0.12,0.4,0.7").split(",").map(Number);

const browser = await chromium.launch({ args: ["--disable-frame-rate-limit", "--disable-gpu-vsync", "--enable-gpu-rasterization", "--ignore-gpu-blocklist"] });
const pages = PAGES.filter((p) => p.startsWith("website/") && (!only || p.includes(only)));

for (const rel of pages) {
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: DPR });
  const page = await ctx.newPage();
  const errs = []; page.on("pageerror", (e) => errs.push(e.message));
  await page.addInitScript(() => {
    window.__rec = null;
    window.__start = (sel) => {
      const els = [...document.querySelectorAll(sel)].filter((el) => {
        const r = el.getBoundingClientRect();
        return r.width > 8 && r.height > 8 && r.bottom > 0 && r.top < innerHeight && r.width < innerWidth * 1.01;
      }).slice(0, 400);
      const name = (el) => `${el.tagName.toLowerCase()}${el.id ? "#" + el.id : ""}${el.classList.length ? "." + [...el.classList].slice(0, 2).join(".") : ""}`;
      window.__rec = { t: [], y: [], tops: els.map(() => []), names: els.map(name), els };
      const f = (t) => {
        const R = window.__rec; if (!R) return;
        R.t.push(t); R.y.push(window.scrollY);
        R.els.forEach((el, i) => R.tops[i].push(el.getBoundingClientRect().top));
        requestAnimationFrame(f);
      };
      requestAnimationFrame(f);
    };
    window.__stop = () => { const R = window.__rec; window.__rec = null; delete R.els; return R; };
  });
  await page.goto(urlFor(rel), { waitUntil: "load" });
  await page.waitForTimeout(5000); // loader + intro
  const maxY = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);

  for (const at of spots) {
    for (const g of gestures) {
      await page.evaluate((y) => window.scrollTo(0, y), Math.round(maxY * at));
      await page.waitForTimeout(1600);
      await page.mouse.move(W / 2, H / 2);
      await page.evaluate(() => window.__start("body *"));
      const t0 = await page.evaluate(() => performance.now());
      if (g === "wheel") {
        // a mouse-wheel flick: 5 notches of 100px, ~45 ms apart
        for (let i = 0; i < 5; i++) { await page.mouse.wheel(0, 100); await page.waitForTimeout(45); }
      } else {
        // trackpad: 60 events at ~8 ms with exponentially decaying deltas (macOS momentum), ending in sub-pixel deltas
        let d = 38;
        for (let i = 0; i < 60; i++) { await page.mouse.wheel(0, d); d *= 0.93; await page.waitForTimeout(8); }
      }
      const tInputEnd = await page.evaluate(() => performance.now());
      await page.waitForTimeout(1600);
      const R = await page.evaluate(() => window.__stop());

      // ---- analysis ----
      const dt = R.t.slice(1).map((t, i) => t - R.t[i]);
      const fps = 1000 / (dt.reduce((a, b) => a + b, 0) / dt.length);
      const sortedDt = [...dt].sort((a, b) => a - b), p95 = sortedDt[Math.floor(sortedDt.length * 0.95)] || 0;
      const iEnd = R.t.findIndex((t) => t >= tInputEnd);
      const post = (arr) => arr.slice(Math.max(0, iEnd));
      const flips = (arr) => { let n = 0, last = 0; for (let i = 1; i < arr.length; i++) { const d = arr[i] - arr[i - 1]; if (Math.abs(d) < 0.02) continue; const s = Math.sign(d); if (last && s !== last) n++; last = s; } return n; };
      const yPost = post(R.y);
      const yFlips = flips(yPost);
      // settle: last frame index where scrollY still changed
      let lastMove = 0; for (let i = 1; i < R.y.length; i++) if (Math.abs(R.y[i] - R.y[i - 1]) > 0.01) lastMove = i;
      const settleMs = Math.max(0, R.t[lastMove] - tInputEnd);
      // sub-pixel crawl: frames after input end where scroll moved by less than one device pixel
      const crawl = yPost.slice(1).filter((y, i) => { const d = Math.abs(y - yPost[i]); return d > 0.01 && d < 1 / DPR; }).length;
      // per-element: flips after input end, and "wobble" = movement not explained by page scroll for in-flow-ish elements
      const offenders = R.tops.map((tops, i) => {
        const tp = post(tops);
        const rel = tp.map((v, k) => v + yPost[k]); // page-relative position (constant for plain in-flow elements)
        const relRange = Math.max(...rel) - Math.min(...rel);
        return { name: R.names[i], flips: flips(tp), relFlips: flips(rel), relRange: +relRange.toFixed(2) };
      }).filter((o) => o.flips > 1 || o.relFlips > 1)
        .sort((a, b) => b.relFlips + b.flips - (a.relFlips + a.flips));
      const uniq = []; const seen = new Set();
      for (const o of offenders) { const k = o.name; if (seen.has(k)) continue; seen.add(k); uniq.push(o); }
      console.log(`${rel.replace("/index.html", "")} @${Math.round(at * 100)}% ${g.padEnd(8)} fps≈${fps.toFixed(0)} p95 ${p95.toFixed(1)}ms | scroll reversals after stop: ${yFlips} | settle ${settleMs.toFixed(0)}ms | sub-pixel crawl frames: ${crawl} | shaking elements: ${offenders.length}`);
      uniq.slice(0, 6).forEach((o) => console.log(`     ↳ ${o.name}  flips:${o.flips} page-relative flips:${o.relFlips} wobble:${o.relRange}px`));
    }
  }
  if (errs.length) console.log("  errors:", [...new Set(errs)].join(" | "));
  await ctx.close();
}
await browser.close();
