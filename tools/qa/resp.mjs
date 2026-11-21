// Responsive sweep across phones, tablets (portrait + landscape, touch) and laptop → 4K screens.
// Usage: node qa/resp.mjs <page> <out-prefix> [--only=phone|tablet|desktop] [--shots=top,mid,all]
// For each device: screenshots (top of page + 3 points down the page), and reports horizontal overflow,
// content width, longest text line, small tap targets on touch devices, clipped/offscreen elements and JS errors.
import { chromium } from "playwright";
import { urlFor } from "./pages.mjs";

const args = process.argv.slice(2);
const [file, out] = args.filter((a) => !a.startsWith("--"));
const opt = Object.fromEntries(args.filter((a) => a.startsWith("--")).map((a) => a.slice(2).split("=")));
const DEVICES = [
  // name, w, h, touch, group
  ["phone-se", 320, 568, true, "phone"],
  ["phone-375", 375, 812, true, "phone"],
  ["phone-390", 390, 844, true, "phone"],
  ["phone-430", 430, 932, true, "phone"],
  ["tablet-mini-p", 744, 1133, true, "tablet"],
  ["ipad-p", 820, 1180, true, "tablet"],
  ["ipad-pro-p", 1024, 1366, true, "tablet"],
  ["ipad-l", 1180, 820, true, "tablet"],
  ["ipad-pro-l", 1366, 1024, true, "tablet"],
  ["laptop-1280", 1280, 800, false, "desktop"],
  ["laptop-1440", 1440, 900, false, "desktop"],
  ["desktop-1920", 1920, 1080, false, "desktop"],
  ["qhd-2560", 2560, 1440, false, "desktop"],
  ["ultrawide-3440", 3440, 1440, false, "desktop"],
  ["4k-3840", 3840, 2160, false, "desktop"],
].filter((d) => !opt.only || d[4] === opt.only);

const browser = await chromium.launch();
let problems = 0;
for (const [name, w, h, touch] of DEVICES) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, isMobile: touch && w < 1000, hasTouch: touch, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(e.message));
  page.on("console", (m) => m.type() === "error" && !/Failed to load resource/.test(m.text()) && errs.push(m.text()));
  page.on("response", (r) => r.status() >= 400 && !/\/shared\/previews\//.test(r.url()) && errs.push(`${r.status()} ${decodeURIComponent(new URL(r.url()).pathname)}`));
  await page.goto(urlFor(file), { waitUntil: "load" });
  await page.waitForTimeout(3200);
  // walk the page so scroll-built content renders
  const H = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < H; y += Math.round(h * 0.8)) { await page.evaluate((y) => window.scrollTo(0, y), y); await page.waitForTimeout(70); }
  await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(700);
  const stats = await page.evaluate((touch) => {
    const vw = document.documentElement.clientWidth;
    const vis = (el) => { const cs = getComputedStyle(el); return cs.display !== "none" && cs.visibility !== "hidden" && +cs.opacity !== 0; };
    let widest = 0, maxCh = 0, offscreen = [];
    for (const el of document.querySelectorAll("body *")) {
      if (!vis(el) || el.closest("[hidden],[aria-hidden='true'],dialog:not([open])")) continue;
      const r = el.getBoundingClientRect();
      if (r.width && r.width < vw - 40 && r.width > widest && el.children.length > 1 && r.height > 80) widest = r.width;
      // text that pokes out of the viewport horizontally (ignores intentionally scrollable rails)
      if (r.width && (r.right > vw + 2 || r.left < -2) && el.textContent.trim() && !el.closest("[data-rail],.rail,.marquee,[class*=marquee],[class*=rail],[class*=track],[class*=scroller]")) {
        const sc = el.closest("*"); let p = el.parentElement, clipped = false;
        while (p && p !== document.body) { const cs = getComputedStyle(p); if (/(hidden|clip|auto|scroll)/.test(cs.overflowX)) { clipped = true; break; } p = p.parentElement; }
        if (!clipped && offscreen.length < 6) offscreen.push(`${el.tagName.toLowerCase()}.${[...el.classList].slice(0, 2).join(".")}`);
      }
    }
    for (const p of document.querySelectorAll("p, li, blockquote")) {
      const r = p.getBoundingClientRect(); const fs = parseFloat(getComputedStyle(p).fontSize);
      if (r.width > 0 && p.textContent.trim().length > 90) maxCh = Math.max(maxCh, Math.round(r.width / (fs * 0.5)));
    }
    const smallTaps = touch ? [...document.querySelectorAll("a, button, [role=button], [role=tab], input, select, summary")].filter((el) => {
      if (!vis(el) || el.closest("[hidden],[aria-hidden='true']")) return false;
      const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && (r.height < 32 || r.width < 32);
    }).map((el) => (el.textContent.trim().slice(0, 18) || el.getAttribute("aria-label") || el.tagName)).slice(0, 6) : [];
    const h1 = document.querySelector("h1");
    return { overflow: document.documentElement.scrollWidth - vw, widest: Math.round(widest), maxCh, smallTaps, offscreen,
      root: getComputedStyle(document.documentElement).fontSize, h1: h1 ? getComputedStyle(h1).fontSize : "-" };
  }, touch);
  const shots = (opt.shots || "top,mid").split(",");
  const points = { top: 0, q1: 0.25, mid: 0.5, q3: 0.75 };
  for (const s of shots.includes("all") ? Object.keys(points) : shots) {
    if (!(s in points)) continue;
    await page.evaluate((f) => window.scrollTo(0, (document.documentElement.scrollHeight - innerHeight) * f), points[s]);
    await page.waitForTimeout(900);
    await page.screenshot({ path: `${out}-${name}-${s}.png` });
  }
  const bad = stats.overflow > 0 || errs.length || stats.offscreen.length;
  if (bad) problems++;
  console.log(`${bad ? "✗" : "✓"} ${name.padEnd(15)} ${String(w).padStart(4)}x${h}  overflow:${stats.overflow}px  content:${stats.widest}px  root:${stats.root} h1:${stats.h1}  line:~${stats.maxCh}ch` +
    (stats.smallTaps.length ? `  smallTaps:${stats.smallTaps.length} [${stats.smallTaps.join(" | ")}]` : "") +
    (stats.offscreen.length ? `  OFFSCREEN:[${stats.offscreen.join(", ")}]` : "") + (errs.length ? `  ERR: ${[...new Set(errs)].slice(0, 3).join(" | ")}` : ""));
  await ctx.close();
}
await browser.close();
console.log(problems ? `\n${problems} device(s) with problems` : "\nAll devices clean");
process.exitCode = problems ? 1 : 0;
