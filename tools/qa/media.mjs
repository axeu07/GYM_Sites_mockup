// Media audit: loads each direction, walks the page, and lists every place a still or clip is shown.
// Fails when a FAMILY (near-identical shots, or a clip + the still taken from it) appears in more than one place,
// or when a soft group is over its limit. Families come from tools/media/catalogue.json.
// A <video> with its own poster is one place. Elements that are not rendered (display:none) are ignored, and so is
// anything inside a closed dialog/drawer: enlarging something already on the page is not a second place.
// Usage: node qa/media.mjs [page-substring] [--w=1440] [--list]   (--list prints every placement)
import { chromium } from "playwright";
import { readFileSync } from "node:fs";
import { PAGES, urlFor } from "./pages.mjs";

const args = process.argv.slice(2);
const opt = Object.fromEntries(args.filter((a) => a.startsWith("--")).map((a) => a.slice(2).split("=")));
const only = args.find((a) => !a.startsWith("--"));
const cat = JSON.parse(readFileSync(new URL("../media/catalogue.json", import.meta.url), "utf8"));
const famOf = (kind, key) => (kind === "video" ? cat.videos[key] : cat.stills[key])?.family;
const WIDTHS = opt.w ? [+opt.w] : [1440, 390];

const browser = await chromium.launch(); let failures = 0;
for (const rel of PAGES.filter((p) => p.startsWith("website/") && (!only || p.includes(only)))) {
  for (const W of WIDTHS) {
    const ctx = await browser.newContext({ viewport: { width: W, height: W < 800 ? 844 : 900 }, isMobile: W < 800, hasTouch: W < 800 });
    const page = await ctx.newPage();
    await page.goto(urlFor(rel), { waitUntil: "load" }); await page.waitForTimeout(3500);
    const H = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < H; y += 600) { await page.evaluate((y) => window.scrollTo(0, y), y); await page.waitForTimeout(90); }
    await page.waitForTimeout(500);
    const places = await page.evaluate(() => {
      const RX = /shared\/(img|video)\/(?:(?:hq|xl|hero)\/)?([a-z0-9-]+?)(-sm|-wide)?\.(jpg|mp4)/g; // incl. hero-grade subfolders
      const keysIn = (str) => { const out = []; for (const m of String(str || "").matchAll(RX)) out.push({ kind: m[1] === "video" ? "video" : "still", key: m[2] }); return out; };
      const path = (el) => { const parts = []; for (let e = el; e && e !== document.body && parts.length < 4; e = e.parentElement) parts.unshift(e.tagName.toLowerCase() + (e.id ? "#" + e.id : e.classList.length ? "." + [...e.classList].slice(0, 2).join(".") : "")); return parts.join(" > "); };
      const section = (el) => { const s = el.closest("section[id], section, header, footer, [id]"); return s ? (s.id ? "#" + s.id : s.tagName.toLowerCase() + (s.classList.length ? "." + s.classList[0] : "")) : "?"; };
      const out = [];
      for (const el of document.querySelectorAll("body *")) {
        if (!el.getClientRects().length) continue;                               // display:none
        if (el.closest("dialog:not([open]), [hidden], [inert], .is-hidden-media")) continue;
        let refs = [];
        if (el.tagName === "IMG") refs = keysIn([el.currentSrc, el.getAttribute("src"), el.getAttribute("srcset"), el.dataset.src].join(" "));
        else if (el.tagName === "VIDEO") refs = keysIn([el.currentSrc, el.getAttribute("src"), el.dataset.src, el.getAttribute("poster"), ...[...el.querySelectorAll("source")].map((s) => s.src)].join(" "));
        else if (el.tagName === "SOURCE" || el.tagName === "PICTURE") continue;
        else { const bg = getComputedStyle(el).backgroundImage; if (bg && bg.includes("shared/")) refs = keysIn(bg); }
        if (!refs.length) continue;
        // video posters are stills of the clip itself: the still catalogue has no entry for a poster named like a clip
        const uniq = [...new Map(refs.map((r) => [r.kind + ":" + r.key, r])).values()];
        out.push({ refs: uniq, where: section(el), path: path(el), parent: el.parentElement });
      }
      // A still and a clip stacked in the same box (siblings) are one place, e.g. a card's photo with its hover video.
      const merged = [];
      for (const pl of out) {
        const prev = merged.find((m) => m.parent === pl.parent);
        if (prev) { for (const r of pl.refs) if (!prev.refs.some((x) => x.kind === r.kind && x.key === r.key)) prev.refs.push(r); }
        else merged.push(pl);
      }
      return merged.map(({ parent, ...rest }) => rest);
    });
    // family → places
    const byFam = new Map(); const unknown = new Set();
    for (const pl of places) {
      const fams = new Set();
      for (const r of pl.refs) {
        // a poster "…/video/<clip>.jpg" is parsed as a still named <clip>: resolve it through the clip catalogue
        const f = famOf(r.kind, r.key) || famOf("video", r.key) || famOf("still", r.key);
        if (!f) unknown.add(r.key); else fams.add(f);
      }
      for (const f of fams) { if (!byFam.has(f)) byFam.set(f, []); byFam.get(f).push(pl); }
    }
    const dups = [...byFam].filter(([f, ps]) => ps.length > 1 && f !== "film");
    const soft = Object.entries(cat.soft_groups).map(([g, v]) => [g, v.max, v.families.filter((f) => byFam.has(f))]).filter(([, max, used]) => used.length > max);
    const label = `${rel.split("/")[1]} @${W}`;
    if (opt.list !== undefined) for (const [f, ps] of [...byFam].sort()) console.log(`   ${f.padEnd(20)} ${ps.map((p) => `${p.where} (${p.refs.map((r) => r.key).join("+")})`).join("  |  ")}`);
    if (dups.length || soft.length || unknown.size) {
      failures++;
      console.log(`✗ ${label}: ${places.length} media places, ${byFam.size} families — ${dups.length} repeated`);
      for (const [f, ps] of dups) console.log(`     repeated "${f}": ` + ps.map((p) => `${p.where} [${p.refs.map((r) => r.key).join("+")}] ${p.path}`).join("\n         also: "));
      for (const [g, max, used] of soft) console.log(`     too many "${g}" shots (${used.length} > ${max}): ${used.join(", ")}`);
      if (unknown.size) console.log(`     not in catalogue: ${[...unknown].join(", ")}`);
    } else console.log(`✓ ${label}: ${places.length} media places, ${byFam.size} families, none repeated`);
    await ctx.close();
  }
}
await browser.close();
process.exitCode = failures ? 1 : 0;
