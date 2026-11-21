// Relevance review aid: every rendered still/clip with the text it sits beside and what the catalogue says it shows.
// Usage: node qa/context.mjs [page-substring] [--w=1440]
import { chromium } from "playwright";
import { readFileSync } from "node:fs";
import { PAGES, urlFor } from "./pages.mjs";
const args = process.argv.slice(2); const only = args.find((a) => !a.startsWith("--"));
const W = +((args.find((a) => a.startsWith("--w=")) || "--w=1440").slice(4));
const cat = JSON.parse(readFileSync(new URL("../media/catalogue.json", import.meta.url), "utf8"));
const b = await chromium.launch();
for (const rel of PAGES.filter((p) => p.startsWith("website/") && (!only || p.includes(only)))) {
  const p = await b.newPage({ viewport: { width: W, height: 900 }, isMobile: W < 800, hasTouch: W < 800 });
  await p.goto(urlFor(rel)); await p.waitForTimeout(3500);
  const H = await p.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < H; y += 600) { await p.evaluate((y) => scrollTo(0, y), y); await p.waitForTimeout(80); }
  const rows = await p.evaluate(() => {
    const RX = /shared\/(img|video)\/(?:(?:hq|xl|hero)\/)?([a-z0-9-]+?)(-sm|-wide)?\.(jpg|mp4)/g;
    const out = []; const seen = new Set();
    for (const el of document.querySelectorAll("img, video, [style*='background']")) {
      if (!el.getClientRects().length) continue;
      const src = [el.currentSrc, el.getAttribute("src"), el.getAttribute("srcset"), el.dataset && el.dataset.src, el.getAttribute("poster"), getComputedStyle(el).backgroundImage].join(" ");
      const keys = [...new Set([...src.matchAll(RX)].map((m) => m[2]))]; if (!keys.length) continue;
      const box = el.closest("figure, article, li, button, a, .card, [class*=card], [class*=tile], [class*=step], section") || el.parentElement;
      const sec = el.closest("section[id], [id]");
      const txt = (box.innerText || "").replace(/\s+/g, " ").trim().slice(0, 110);
      const k = keys.join("+") + "|" + txt; if (seen.has(k)) continue; seen.add(k);
      out.push({ sec: sec ? "#" + sec.id : "", keys, alt: (el.getAttribute("alt") || "").slice(0, 70), txt });
    }
    return out;
  });
  console.log(`\n===== ${rel.split("/")[1]} (${rows.length} places)`);
  for (const r of rows) {
    const desc = r.keys.map((k) => (cat.stills[k] || cat.videos[k] || {}).desc || "?").filter((v, i, a) => a.indexOf(v) === i).join(" / ");
    console.log(`${r.sec.padEnd(12)} [${r.keys.join("+")}]\n      shows: ${desc}\n      beside: ${r.txt || "(no text)"}${r.alt ? "\n      alt: " + r.alt : ""}`);
  }
  await p.close();
}
await b.close();
