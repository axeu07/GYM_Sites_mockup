// Lists every hero-grade file (shared/video/hq, img/hero, img/xl) the pages request while every control is
// clicked, at desktop (2560@1.5 and 1440@1) and phone (390@3), and checks it against tools/deploy/hq-keep.txt.
import { chromium } from "playwright";
import { readFileSync } from "node:fs";
import { PAGES, urlFor } from "./pages.mjs";
const keep = new Set(readFileSync(new URL("../deploy/hq-keep.txt", import.meta.url), "utf8").split("\n").map((l) => l.trim()).filter((l) => l && !l.startsWith("#")));
const SEL = 'button, [role="button"], [role="tab"], a[href^="#"], summary, .chip, [role="option"], [data-goal], [data-value]';
const seen = new Map();
const b = await chromium.launch();
for (const [w, h, dpr] of [[2560, 1440, 1.5], [1440, 900, 1], [390, 844, 3]]) {
  for (const rel of PAGES.filter((p) => p.startsWith("website/"))) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dpr, isMobile: w < 800, hasTouch: w < 800 });
    const p = await ctx.newPage();
    p.on("popup", (x) => x.close().catch(() => {}));
    p.on("request", (r) => { const m = /shared\/((?:video\/hq|img\/hero|img\/xl)\/[a-z0-9-]+?)(?:-sm|-wide)?\.(?:jpg|mp4)/.exec(decodeURIComponent(r.url())); if (m) { if (!seen.has(m[1])) seen.set(m[1], new Set()); seen.get(m[1]).add(`${rel.split("/")[1]}@${w}`); } });
    await p.goto(urlFor(rel), { waitUntil: "load" }); await p.waitForTimeout(3000);
    const n = await p.evaluate((s) => document.querySelectorAll(s).length, SEL);
    for (let i = 0; i < Math.min(n, 260); i++) {
      const ok = await p.evaluate(({ s, i }) => { const el = document.querySelectorAll(s)[i]; if (!el) return false; const r = el.getBoundingClientRect(); if (!r.width || el.disabled || el.type === "submit" || el.closest("[hidden],[inert]")) return false; el.scrollIntoView({ block: "center" }); el.click(); return true; }, { s: SEL, i });
      if (ok) { await p.waitForTimeout(90); await p.keyboard.press("Escape"); }
    }
    await p.waitForTimeout(800); await ctx.close();
  }
}
await b.close();
let missing = 0;
for (const [k, where] of [...seen].sort()) { const ok = keep.has(k); if (!ok) missing++; console.log(`${ok ? "✓" : "✗ NOT IN hq-keep.txt"}  ${k}   (${[...where].join(", ")})`); }
const unused = [...keep].filter((k) => !seen.has(k));
if (unused.length) console.log("listed but never requested:", unused.join(", "));
console.log(missing ? `${missing} hero-grade file(s) would be missing from the deploy` : "hq-keep.txt covers every hero-grade request");
process.exitCode = missing ? 1 : 0;
