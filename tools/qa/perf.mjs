// Scroll-smoothness profile: node perf.mjs [url-or-file ...] [--w=1440] [--h=900] [--dpr=2] [--cpu=1]
// For each page: idle CPU while sitting still (catches animation loops that never stop), then a
// wheel-driven scroll through the page recording every frame. Prints frame stats, long tasks and
// where main-thread time went (script / layout / style).
import { chromium } from "playwright";
import { pathToFileURL } from "node:url";

const args = process.argv.slice(2);
const opt = Object.fromEntries(args.filter((a) => a.startsWith("--")).map((a) => a.slice(2).split("=")));
const W = +(opt.w || 1440), H = +(opt.h || 900), DPR = +(opt.dpr || 2), CPU = +(opt.cpu || 1);
import { urlFor } from "./pages.mjs";
const DEFAULT = [
  "website/a-akari/index.html", "website/b-dojo/index.html", "website/c-ikigai/index.html",
];
const _OLD = [
  "website/a-floodlight/index.html", "website/b-matchday/index.html", "website/c-kinetic/index.html",
  "lms/1-locker-room/index.html#catalog", "lms/2-playbook/index.html#catalog", "lms/3-clipboard/index.html#dashboard",
];
const targets = args.filter((a) => !a.startsWith("--"));
const urls = (targets.length ? targets : DEFAULT).map((t) => urlFor(t));

const browser = await chromium.launch({ args: ["--enable-gpu-rasterization", "--ignore-gpu-blocklist"] });
const metric = async (cdp) => Object.fromEntries((await cdp.send("Performance.getMetrics")).metrics.map((m) => [m.name, m.value]));
const diff = (a, b, k) => ((b[k] - a[k]) * 1000).toFixed(0);

console.log(`viewport ${W}x${H} @${DPR}x, cpu throttle ${CPU}x`);
for (const url of urls) {
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: DPR });
  const page = await ctx.newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(e.message));
  const cdp = await ctx.newCDPSession(page);
  await cdp.send("Performance.enable");
  if (CPU > 1) await cdp.send("Emulation.setCPUThrottlingRate", { rate: CPU });
  await page.addInitScript(() => {
    window.__lt = [];
    try { new PerformanceObserver((l) => l.getEntries().forEach((e) => window.__lt.push(e.duration))).observe({ type: "longtask", buffered: true }); } catch {}
    window.__frames = null;
    window.__rec = () => { window.__frames = []; let last = performance.now(); const f = (t) => { if (!window.__frames) return; window.__frames.push(t - last); last = t; requestAnimationFrame(f); }; requestAnimationFrame(f); };
    window.__stop = () => { const fr = window.__frames; window.__frames = null; return fr; };
  });
  await page.goto(url, { waitUntil: "load" });
  await page.waitForTimeout(3500);
  // Idle: sit still for 3s at the top
  const i0 = await metric(cdp); await page.waitForTimeout(3000); const i1 = await metric(cdp);
  const idleTask = (i1.TaskDuration - i0.TaskDuration) / 3 * 100; // % of one core
  // Scroll: wheel steps like a trackpad, through the whole page
  const total = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
  await page.evaluate(() => { window.__lt = []; window.__rec(); });
  const s0 = await metric(cdp);
  await page.mouse.move(W / 2, H / 2);
  const steps = Math.min(400, Math.ceil(total / 100));
  for (let i = 0; i < steps; i++) { await page.mouse.wheel(0, 100); await page.waitForTimeout(16); }
  await page.waitForTimeout(1500);
  const s1 = await metric(cdp);
  const frames = (await page.evaluate(() => window.__stop())).slice(1);
  const lt = await page.evaluate(() => window.__lt);
  const sorted = [...frames].sort((a, b) => a - b);
  const p = (q) => sorted[Math.floor(q * (sorted.length - 1))] || 0;
  const avg = frames.reduce((a, b) => a + b, 0) / frames.length;
  const slow = frames.filter((f) => f > 25).length;
  const name = decodeURIComponent(new URL(url).pathname).replace("/index.html", "");
  console.log(`\n${name}`);
  console.log(`  idle CPU ${idleTask.toFixed(0)}% | scroll ${frames.length} frames avg ${(1000 / avg).toFixed(0)}fps p50 ${p(0.5).toFixed(1)}ms p95 ${p(0.95).toFixed(1)}ms max ${p(1).toFixed(0)}ms | >25ms: ${(100 * slow / frames.length).toFixed(1)}%`);
  console.log(`  long tasks ${lt.length} (${lt.reduce((a, b) => a + b, 0).toFixed(0)}ms) | main thread during scroll: task ${diff(s0, s1, "TaskDuration")}ms script ${diff(s0, s1, "ScriptDuration")}ms layout ${diff(s0, s1, "LayoutDuration")}ms (${s1.LayoutCount - s0.LayoutCount}x) style ${diff(s0, s1, "RecalcStyleDuration")}ms (${s1.RecalcStyleCount - s0.RecalcStyleCount}x) | heap ${(s1.JSHeapUsedSize / 1e6).toFixed(0)}MB nodes ${s1.Nodes}`);
  if (errs.length) console.log("  errors:", errs.join(" | "));
  await ctx.close();
}
await browser.close();
