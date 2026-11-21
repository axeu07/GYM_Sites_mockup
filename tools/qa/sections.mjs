// Viewport screenshots of each section (for reviewing a direction quickly).
// Usage: node qa/sections.mjs <page> <out-dir> [w=1440] [h=900] [selectors comma-separated]
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { urlFor } from "./pages.mjs";
const [file, out, w = "1440", h = "900", sels] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
const mobile = +w < 700;
const ctx = await browser.newContext({ viewport: { width: +w, height: +h }, ...(mobile ? { isMobile: true, hasTouch: true, deviceScaleFactor: 1 } : {}) });
const page = await ctx.newPage(); const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => m.type() === "error" && !/Failed to load resource/.test(m.text()) && errors.push(m.text()));
page.on("response", (r) => r.status() >= 400 && errors.push(`${r.status()} ${new URL(r.url()).pathname}`));
await page.goto(urlFor(file), { waitUntil: "load" });
await page.waitForTimeout(4200);
const list = sels ? sels.split(",") : await page.evaluate(() => [...document.querySelectorAll("main > section[id], main > div[id], footer, body > section[id]")].map((s) => "#" + (s.id || "") ).filter((s) => s !== "#"));
await page.screenshot({ path: `${out}/00-top.png` });
let i = 1;
for (const s of list) {
  const el = await page.$(s); if (!el) continue;
  const y = await el.evaluate((e) => e.getBoundingClientRect().top + window.scrollY);
  // walk there so scroll-driven scenes update
  const from = await page.evaluate(() => window.scrollY);
  for (let k = 1; k <= 8; k++) { await page.evaluate((v) => window.scrollTo(0, v), from + ((y - from) * k) / 8); await page.waitForTimeout(60); }
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${out}/${String(i++).padStart(2, "0")}-${s.replace(/[^a-z0-9]/gi, "")}.png` });
}
console.log(errors.length ? errors.join("\n") : "no errors", "\n", list.join(" "));
await browser.close();
