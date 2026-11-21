// Captures the chooser thumbnails for each direction:
//   <key>.jpg   — desktop hero at 1440x900 (16:10 cards)
//   <key>-m.jpg — phone hero at 390x844 @2x (used by the tall horizontal cards on tablets)
// Usage: node media/previews.mjs [keys...]   (keys: a b c)
import { chromium } from "playwright";
import { fileURLToPath } from "node:url";
import { urlFor } from "../qa/pages.mjs";

const OUT = fileURLToPath(new URL("../../mockups/shared/previews/", import.meta.url));
const ALL = { a: "website/a-akari/index.html", b: "website/b-dojo/index.html", c: "website/c-ikigai/index.html" };
const keys = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(ALL);
const SHOTS = [
  { suffix: "", ctx: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 }, mouse: [820, 420] },
  { suffix: "-m", ctx: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true } },
];

const browser = await chromium.launch();
for (const k of keys) {
  for (const s of SHOTS) {
    const ctx = await browser.newContext(s.ctx);
    const page = await ctx.newPage();
    await page.goto(urlFor(ALL[k]), { waitUntil: "load" });
    await page.waitForTimeout(4800); // loader + hero intro
    if (s.mouse) { await page.mouse.move(...s.mouse); await page.waitForTimeout(700); } // hover-reactive heroes
    await page.screenshot({ path: `${OUT}${k}${s.suffix}.jpg`, type: "jpeg", quality: s.suffix ? 78 : 82 });
    console.log("saved", `${k}${s.suffix}.jpg`);
    await ctx.close();
  }
}
await browser.close();
