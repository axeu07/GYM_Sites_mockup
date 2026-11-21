// Local preview server for ../mockups. Usage (from tools/): node serve.mjs [port=8080]
// Folder addresses without a trailing slash (e.g. /website/a-akari) are redirected to /website/a-akari/,
// so the pages' relative links (style.css, main.js, ../../shared/…) resolve correctly — like any real host.
import http from "node:http";
import { createReadStream, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join, extname, normalize } from "node:path";

const ROOT = fileURLToPath(new URL("../mockups/", import.meta.url));
const PORT = +process.argv[2] || 8080;
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8", ".json": "application/json", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png",
  ".svg": "image/svg+xml", ".mp4": "video/mp4", ".webp": "image/webp", ".ico": "image/x-icon", ".txt": "text/plain; charset=utf-8" };

http.createServer((req, res) => {
  const url = new URL(req.url, "http://x");
  const rel = normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[\\/])+/, "");
  let file = join(ROOT, rel), st;
  try { st = statSync(file); } catch { res.writeHead(404); return res.end("Not found"); }
  if (st.isDirectory()) {
    if (!url.pathname.endsWith("/")) { res.writeHead(301, { Location: url.pathname + "/" + url.search }); return res.end(); }
    file = join(file, "index.html");
    try { st = statSync(file); } catch { res.writeHead(404); return res.end("Not found"); }
  }
  const type = TYPES[extname(file).toLowerCase()] || "application/octet-stream";
  const range = req.headers.range && /bytes=(\d*)-(\d*)/.exec(req.headers.range);
  if (range) { // videos need range requests to play and seek
    const start = range[1] ? +range[1] : 0, end = range[2] ? +range[2] : st.size - 1;
    res.writeHead(206, { "Content-Type": type, "Content-Range": `bytes ${start}-${end}/${st.size}`, "Accept-Ranges": "bytes", "Content-Length": end - start + 1, "Cache-Control": "no-cache" });
    return createReadStream(file, { start, end }).pipe(res);
  }
  res.writeHead(200, { "Content-Type": type, "Content-Length": st.size, "Accept-Ranges": "bytes", "Cache-Control": "no-cache" });
  createReadStream(file).pipe(res);
}).listen(PORT, () => console.log(`IKIGAI mockups: http://localhost:${PORT}/`));
