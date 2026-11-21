// Viewport screenshots while wheel-scrolling (works with pinned/scrubbed sections, unlike full-page shots).
// Usage: node scrollshots.mjs <page-rel-or-file> <out-prefix> [width=1440] [height=900] [step=height]
import { chromium } from "playwright";


import { urlFor } from "./pages.mjs";
const [file, out, w = "1440", h = "900", step] = process.argv.slice(2);
const url = urlFor(file);
const S = +(step || h);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: +w, height: +h }, isMobile: +w < 800, hasTouch: +w < 800 });
const errs = []; page.on("pageerror", (e) => errs.push(e.message));
page.on("response", (r) => r.status() >= 400 && !/\/shared\/previews\//.test(r.url()) && errs.push(`${r.status()} ${decodeURIComponent(new URL(r.url()).pathname)}`)); page.on("console", (m) => m.type() === "error" && !/Failed to load resource/.test(m.text()) && errs.push(m.text()));
await page.goto(url, { waitUntil: "load" }); await page.waitForTimeout(3200);
const total = await page.evaluate(() => document.documentElement.scrollHeight);
let i = 0;
await page.mouse.move(+w / 2, +h / 2);
for (let y = 0; y < total && i < 60; y += S, i++) {
  if (i) await page.mouse.wheel(0, S);
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${out}-${String(i).padStart(2, "0")}.png` });
}
console.log(`${i} shots, page height ${total}px${errs.length ? "\nERRORS: " + [...new Set(errs)].join(" | ") : ""}`);
await browser.close();
