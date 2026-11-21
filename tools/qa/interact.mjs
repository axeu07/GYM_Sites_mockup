// Click-everything smoke test: clicks every visible button, tab, chip and in-page link on each page,
// pressing Escape between clicks, and reports JS errors. Usage: node interact.mjs [--w=1440] [--page=substring]
import { chromium } from "playwright";
import { PAGES, urlFor } from "./pages.mjs";
const opt = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, "").split("=")));
const W = +(opt.w || 1440), H = W < 800 ? 844 : 900;
const SEL = 'button, [role="button"], [role="tab"], a[href^="#"], summary, input[type="checkbox"], input[type="radio"], .chip';
const browser = await chromium.launch(); let total = 0, failures = 0;
for (const rel of PAGES.filter((p) => !opt.page || p.includes(opt.page))) {
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, isMobile: W < 800, hasTouch: W < 800 });
  const page = await ctx.newPage(); const errs = [];
  page.on("pageerror", (e) => errs.push(e.message));
  page.on("response", (r) => r.status() >= 400 && !/\/shared\/previews\//.test(r.url()) && errs.push(`${r.status()} ${decodeURIComponent(new URL(r.url()).pathname)}`));
  page.on("console", (m) => m.type() === "error" && !/Failed to load resource/.test(m.text()) && errs.push(m.text()));
  page.on("dialog", (d) => d.dismiss());
  page.on("popup", (p) => p.close().catch(() => {}));
  await page.goto(urlFor(rel), { waitUntil: "load" }); await page.waitForTimeout(2800);
  const n = await page.evaluate((sel) => document.querySelectorAll(sel).length, SEL);
  let clicked = 0;
  for (let i = 0; i < Math.min(n, 220); i++) {
    const res = await page.evaluate(({ sel, i }) => {
      const el = document.querySelectorAll(sel)[i]; if (!el) return "gone";
      const r = el.getBoundingClientRect(), cs = getComputedStyle(el);
      if (!r.width || !r.height || cs.visibility === "hidden" || el.disabled || el.closest("[hidden],[inert]")) return "skip";
      const href = el.getAttribute("href"); if (href && href.length < 2) return "skip";
      if (el.type === "submit") return "skip";
      el.scrollIntoView({ block: "center" }); el.click(); return "ok";
    }, { sel: SEL, i });
    if (res === "ok") { clicked++; await page.waitForTimeout(130); await page.keyboard.press("Escape"); }
  }
  total += clicked;
  if (errs.length) { failures++; console.log(`✗ ${rel}: ${clicked} clicks, ${errs.length} errors\n    ${[...new Set(errs)].slice(0, 6).join("\n    ")}`); }
  else console.log(`✓ ${rel}: ${clicked} clicks`);
  await ctx.close();
}
await browser.close();
console.log(`\n${total} clicks at ${W}px, ${failures ? failures + " pages with errors" : "no errors"}`);
process.exitCode = failures ? 1 : 0;
