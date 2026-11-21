// Lift-door seal test (Direction A). Puts a pure white sheet behind the closed doors and checks that no
// light leaks along any edge of the frame, across many screen sizes and display scalings.
// Usage: node qa/doors.mjs [--old]   (--old re-applies the original door sizing to prove the test detects the bug)
import { chromium } from "playwright";
import { urlFor } from "./pages.mjs";
const OLD = process.argv.includes("--old");
const SIZES = [[1280, 800], [1366, 768], [1440, 900], [1512, 982], [1600, 900], [1728, 1117], [1920, 1080], [2048, 1152], [2304, 1296], [2560, 1440], [3008, 1692], [3440, 1440], [3840, 2160], [1711, 963], [2133, 1200], [2731, 1536]];
const b = await chromium.launch(); let bad = 0, n = 0, skipped = 0;
for (const dpr of [1, 1.25, 1.5, 2]) {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: dpr });
  const p = await ctx.newPage();
  await p.goto(urlFor("website/a-lights-on/index.html")); await p.waitForTimeout(4000);
  // Doors are forced shut with CSS (not the is-closed class) so the page's own floor-change logic can't reopen them mid-test.
  // The white sheet sits inside the media layer (where the videos are), so it obeys the same rules as the real picture.
  await p.evaluate(() => document.querySelector("#stage").classList.add("is-closed"));
  await p.addStyleTag({ content: `#stageMedia::after { content: ""; position: absolute; inset: 0; background: #fff; z-index: 3; }
    #stage .door { transition: none !important; } #stage .door--l { transform: translateX(0) !important; } #stage .door--r { transform: translateX(0) scaleX(-1) !important; }` +
    (OLD ? `.door { top: 0 !important; bottom: 0 !important; width: 50.2% !important; } .door--l { left: 0 !important; } .door--r { right: 0 !important; } #stageMedia { visibility: visible !important; }` : "") });
  for (const [w, h] of SIZES) {
    await p.setViewportSize({ width: w, height: h }); await p.waitForTimeout(200);
    await p.evaluate(() => { const t = document.querySelector("#elevTrack"); const r = t.getBoundingClientRect(); window.scrollTo(0, r.top + scrollY + innerHeight * 0.6); });
    await p.waitForTimeout(300);
    // The page opens the doors itself when the lift "arrives"; hold them shut the way a floor change does, and
    // only measure while the is-closed state is really in force.
    let held = false;
    for (let t = 0; t < 4 && !held; t++) {
      await p.evaluate(() => document.querySelector("#stage").classList.add("is-closed")); await p.waitForTimeout(640);
      held = await p.evaluate(() => document.querySelector("#stage").classList.contains("is-closed"));
    }
    if (!held) { skipped++; continue; }
    const r = await p.evaluate(() => { const s = document.querySelector("#stage").getBoundingClientRect(); return { l: s.left, r: s.right, t: s.top, b: s.bottom }; });
    if (r.r - r.l < 200 || r.b - r.t < 200) continue; // rig not shown at this size
    const strips = { right: { x: r.r - 8, y: r.t + 60, width: 8, height: r.b - r.t - 120 }, left: { x: r.l, y: r.t + 60, width: 8, height: r.b - r.t - 120 }, top: { x: r.l + 60, y: r.t, width: r.r - r.l - 120, height: 8 }, bottom: { x: r.l + 60, y: r.b - 8, width: r.r - r.l - 120, height: 8 } };
    for (const [name, clip] of Object.entries(strips)) {
      const buf = await p.screenshot({ clip, type: "png" });
      const max = await p.evaluate(async (b64) => { const img = new Image(); img.src = "data:image/png;base64," + b64; await img.decode(); const c = document.createElement("canvas"); c.width = img.width; c.height = img.height; const x = c.getContext("2d"); x.drawImage(img, 0, 0); const d = x.getImageData(0, 0, c.width, c.height).data; let m = 0; for (let i = 0; i < d.length; i += 4) m = Math.max(m, (d[i] + d[i + 1] + d[i + 2]) / 3); return Math.round(m); }, buf.toString("base64"));
      n++; if (max > 80) { bad++; if (bad <= 12) console.log(`  LEAK ${w}x${h}@${dpr} ${name} edge: brightness ${max}`); }
    }
  }
  await ctx.close();
}
await b.close();
console.log((bad ? `${bad} of ${n} edge checks leak light` : `Doors sealed: no light leak in ${n} edge checks`) + (skipped ? ` (${skipped} sizes skipped: doors reopened by the page)` : ""));
process.exitCode = bad && !OLD ? 1 : 0;
