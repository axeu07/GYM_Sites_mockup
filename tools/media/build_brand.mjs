// Renders the STAND-IN logo masks (recolourable via CSS mask) and favicons into mockups/shared/brand.
// The club has not supplied a logo file yet: the mark is the four overlapping circles of the ikigai sign on their
// door, the wordmark is "Ikigai" in a bold italic like their poster. Replace with build_logo.py once the real file arrives.
// Usage (from tools/): node media/build_brand.mjs
import { chromium } from "playwright";
import { fileURLToPath } from "node:url";
import path from "node:path";

const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../mockups/shared/brand");
const FONT = `<link href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@1,800&family=Manrope:wght@700&display=block" rel="stylesheet">`;
// Four circles around a centre, like the ikigai diagram; drawn as strokes so the mask reads at small sizes.
const mark = (s, stroke = 0.075) => {
  const r = 0.28 * s, o = 0.17 * s, c = s / 2, w = stroke * s;
  return `<svg width="${s}" height="${s}" viewBox="0 0 ${s} ${s}" xmlns="http://www.w3.org/2000/svg">
    ${[[0, -o], [o, 0], [0, o], [-o, 0]].map(([x, y]) => `<circle cx="${c + x}" cy="${c + y}" r="${r}" fill="none" stroke="#000" stroke-width="${w}"/>`).join("")}
    <circle cx="${c}" cy="${c}" r="${0.055 * s}" fill="#000"/></svg>`;
};
const page = (w, h, body, bg = "transparent") => `<!doctype html><html><head>${FONT}<style>
  html,body{margin:0;width:${w}px;height:${h}px;background:${bg};overflow:hidden}
  .row{display:flex;align-items:center;height:100%;gap:${Math.round(h * 0.12)}px}
  .w{font:italic 800 ${Math.round(h * 0.86)}px/1 Poppins, sans-serif;letter-spacing:-.02em;color:#000;padding:0 .04em}
  .stack{display:flex;flex-direction:column;justify-content:center}
  .sub{font:700 ${Math.round(h * 0.13)}px/1 Manrope, sans-serif;letter-spacing:.42em;color:#000;margin:.25em 0 0 .3em}
</style></head><body>${body}</body></html>`;

const browser = await chromium.launch();
const ctx = await browser.newContext({ deviceScaleFactor: 1 });
const p = await ctx.newPage();
async function shot(file, w, h, html, opts = {}) {
  await p.setViewportSize({ width: w, height: h });
  await p.setContent(html, { waitUntil: "networkidle" });
  await p.evaluate(() => document.fonts.ready);
  await p.screenshot({ path: path.join(OUT, file), omitBackground: !opts.bg, clip: { x: 0, y: 0, width: w, height: h } });
  console.log("wrote", file);
}
await shot("mark.png", 274, 265, page(274, 265, `<div class="row" style="justify-content:center">${mark(260)}</div>`));
await shot("wordmark.png", 691, 208, page(691, 208, `<div class="row" style="justify-content:center"><span class="w" style="font-size:170px">Ikigai</span></div>`));
await shot("lockup.png", 936, 265, page(936, 265, `<div class="row">${mark(250)}<div class="stack"><span class="w" style="font-size:150px;line-height:.95">Ikigai</span><span class="sub" style="font-size:31px">FITNESS CLUB</span></div></div>`));
// Favicons: the ember mark on black.
const fav = (s) => page(s, s, `<div style="width:${s}px;height:${s}px;border-radius:${s * 0.22}px;background:#0A0A0A;display:grid;place-items:center">${mark(Math.round(s * 0.86), 0.09).replace(/#000/g, "#FF5A1F")}</div>`);
for (const s of [32, 180, 512]) await shot(`favicon-${s}.png`, s, s, fav(s));
await browser.close();
