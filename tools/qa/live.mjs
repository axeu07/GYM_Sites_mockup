// Checks the deployed site: every page loads without console errors or failed requests on a large
// monitor and a phone, and private files are not served.  node qa/live.mjs [out-dir-for-screenshots]
import { chromium } from "playwright";
import fs from "node:fs";
const base = fs.readFileSync(new URL("../deploy/site-url.txt", import.meta.url), "utf8").trim().replace(/\/$/, "");
const out = process.argv[2];
// each page by the address the chooser links to, and by its bare folder address (what someone might type or share)
const pages = ["/", ...["a-akari", "b-dojo", "c-ikigai"].flatMap(d => [`/website/${d}/index.html`, `/website/${d}`])];
const sizes = [{ w: 2560, h: 1440, dpr: 1.5 }, { w: 390, h: 844, dpr: 3 }];
const browser = await chromium.launch();
let bad = 0;
for (const s of sizes) {
  const ctx = await browser.newContext({ viewport: { width: s.w, height: s.h }, deviceScaleFactor: s.dpr });
  for (const p of pages) {
    const page = await ctx.newPage(); const errs = [];
    page.on("console", m => m.type() === "error" && errs.push(m.text()));
    page.on("pageerror", e => errs.push(String(e)));
    page.on("response", r => r.status() >= 400 && errs.push(r.status() + " " + r.url()));
    const res = await page.goto(base + p, { waitUntil: "load" });
    await page.waitForTimeout(3500);
    // scroll through so lazy media is requested too
    const h = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < h; y += s.h) { await page.evaluate(v => scrollTo(0, v), y); await page.waitForTimeout(250); }
    await page.evaluate(() => scrollTo(0, 0)); await page.waitForTimeout(600);
    if (out) await page.screenshot({ path: `${out}/${(p.split("/")[2] || "index")}-${s.w}.jpg`, quality: 80 });
    const ok = res.status() === 200 && !errs.length; if (!ok) bad++;
    console.log(`${ok ? "✓" : "✗"} ${s.w}px ${p} → ${res.status()}${errs.length ? "\n   " + [...new Set(errs)].slice(0, 6).join("\n   ") : ""}`);
    await page.close();
  }
  await ctx.close();
}
for (const priv of ["/.env.local", "/.vercel/project.json"]) {
  const r = await fetch(base + priv); const ok = r.status === 404; if (!ok) bad++;
  console.log(`${ok ? "✓" : "✗"} ${priv} not served (${r.status})`);
}
await browser.close();
console.log(bad ? `${bad} problem(s)` : "Live site clean");
process.exit(bad ? 1 : 0);
