// Console errors + horizontal overflow on every page at phone, laptop and 4K widths.
// Usage: node check.mjs [page-substring]
import { chromium } from "playwright";
import { PAGES, urlFor } from "./pages.mjs";
const only = process.argv[2];
const b = await chromium.launch(); const errs = [];
for (const u of PAGES.filter((p) => !only || p.includes(only)))
  for (const w of [360, 1440, 2560]) {
    const ctx = await b.newContext({ viewport: { width: w, height: w < 800 ? 780 : 900 }, isMobile: w < 800, hasTouch: w < 800 });
    const p = await ctx.newPage();
    p.on("console", (m) => m.type() === "error" && !/Failed to load resource/.test(m.text()) && errs.push(`${u}@${w} ${m.text()}`));
    p.on("pageerror", (e) => errs.push(`${u}@${w} ${e.message}`));
    p.on("response", (r) => r.status() >= 400 && !/\/shared\/previews\//.test(r.url()) && errs.push(`${u}@${w} ${r.status()} ${decodeURIComponent(new URL(r.url()).pathname)}`));
    await p.goto(urlFor(u), { waitUntil: "load" }); await p.waitForTimeout(2500);
    // scroll through so lazy content / scroll-built sections render, then measure
    const h = await p.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < h; y += 700) { await p.evaluate((y) => window.scrollTo(0, y), y); await p.waitForTimeout(60); }
    const o = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    if (o > 0) errs.push(`${u}@${w} horizontal overflow ${o}px`);
    await ctx.close();
  }
await b.close();
console.log(errs.length ? errs.join("\n") : "No console errors, no overflow (360/1440/2560)");
process.exitCode = errs.length ? 1 : 0;
