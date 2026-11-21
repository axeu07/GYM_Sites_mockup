// Shared QA config. Serves ../../mockups over a tiny local HTTP server (like production: CSS masks,
// fetch and video range requests behave as they will on Vercel — file:// blocks mask images via CORS).
import http from "node:http";
import { createReadStream, statSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join, extname, relative, resolve } from "node:path";

export const PAGES = [
  "index.html",
  "website/a-lights-on/index.html",
  "website/b-academy/index.html",
  "website/c-solutions/index.html",
];
export const DIR = fileURLToPath(new URL("../../mockups/", import.meta.url));
const TYPES = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".json": "application/json",
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".svg": "image/svg+xml", ".mp4": "video/mp4",
  ".woff2": "font/woff2", ".ico": "image/x-icon", ".txt": "text/plain", ".webp": "image/webp" };

const server = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (p.endsWith("/")) p += "index.html";
  const f = join(DIR, p);
  if (!f.startsWith(DIR) || !existsSync(f) || p.split("/").some((s) => s.startsWith("._"))) { res.writeHead(404); return res.end("not found"); }
  const size = statSync(f).size, type = TYPES[extname(f).toLowerCase()] || "application/octet-stream";
  const range = req.headers.range && /bytes=(\d*)-(\d*)/.exec(req.headers.range);
  if (range) {
    const start = range[1] ? +range[1] : 0, end = range[2] ? Math.min(+range[2], size - 1) : size - 1;
    res.writeHead(206, { "Content-Type": type, "Content-Range": `bytes ${start}-${end}/${size}`, "Accept-Ranges": "bytes", "Content-Length": end - start + 1 });
    return createReadStream(f, { start, end }).pipe(res);
  }
  res.writeHead(200, { "Content-Type": type, "Content-Length": size, "Accept-Ranges": "bytes" });
  createReadStream(f).pipe(res);
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
server.unref(); // never keeps a QA script alive
export const ROOT = new URL(`http://127.0.0.1:${server.address().port}/`);
// Page or file path → served URL. Accepts "website/x/index.html", an absolute path inside mockups/, or a full URL.
export const urlFor = (p) => {
  if (/^https?:/.test(p)) return p;
  const abs = resolve(p);
  const rel = existsSync(abs) && abs.startsWith(DIR.replace(/\/$/, "")) ? relative(DIR, abs) : p;
  return new URL(rel.split("/").map(encodeURIComponent).join("/"), ROOT).href;
};
