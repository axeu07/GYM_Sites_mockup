// Renders the link-preview image (WhatsApp / iMessage / LinkedIn) → mockups/shared/og.jpg (1200x630).
// Served over HTTP from the project root so the CSS logo mask loads.
import { chromium } from "playwright";
import http from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join, extname } from "node:path";
const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const T = { ".html": "text/html", ".png": "image/png", ".jpg": "image/jpeg", ".css": "text/css" };
const srv = http.createServer((q, r) => { const f = join(ROOT, decodeURIComponent(new URL(q.url, "http://x").pathname)); if (!existsSync(f) || statSync(f).isDirectory()) { r.writeHead(404); return r.end(); } r.writeHead(200, { "Content-Type": T[extname(f)] || "application/octet-stream" }); createReadStream(f).pipe(r); });
await new Promise((ok) => srv.listen(0, "127.0.0.1", ok));
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1200, height: 630 } });
await p.goto(`http://127.0.0.1:${srv.address().port}/tools/media/og.html`, { waitUntil: "networkidle" });
await p.waitForTimeout(800);
await p.screenshot({ path: join(ROOT, "mockups/shared/og.jpg"), type: "jpeg", quality: 86 });
await b.close(); srv.close();
console.log("saved mockups/shared/og.jpg");
