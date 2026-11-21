// Usage: node shot.mjs <page-rel-or-file> <out-prefix> [hash]
// Writes <out>-desktop.png (1440, full page after scrolling through), <out>-mobile.png (390), <out>-reduced.png; prints console errors.
import { chromium } from "playwright";


import { urlFor } from "./pages.mjs";
const [file, out, hash = ""] = process.argv.slice(2);
const url = urlFor(file) + hash;
const browser = await chromium.launch(); const errors = [];
async function capture(name, opts) {
  const ctx = await browser.newContext(opts); const page = await ctx.newPage();
  page.on("console", (m) => m.type() === "error" && !/Failed to load resource/.test(m.text()) && errors.push(`[${name}] ${m.text()}`));
  page.on("pageerror", (e) => errors.push(`[${name}] pageerror: ${e.message}`));
  page.on("response", (r) => r.status() >= 400 && !/\/shared\/previews\//.test(r.url()) && errors.push(`[${name}] ${r.status()} ${decodeURIComponent(new URL(r.url()).pathname)}`));
  await page.goto(url, { waitUntil: "load" }); await page.waitForTimeout(3000);
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < h; y += 500) { await page.evaluate((y) => window.scrollTo(0, y), y); await page.waitForTimeout(110); }
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${out}-${name}.png`, fullPage: true });
  await ctx.close();
}
await capture("desktop", { viewport: { width: 1440, height: 900 } });
await capture("mobile", { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
await capture("reduced", { viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
await browser.close();
console.log(errors.length ? errors.join("\n") : "No console errors");
