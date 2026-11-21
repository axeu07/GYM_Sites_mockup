// Every relative href/src/url() in the mockups must resolve to a real file.
import { fileURLToPath } from "node:url";
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
const ROOT = fileURLToPath(new URL("../../mockups", import.meta.url));
const walk = (d) => readdirSync(d).flatMap((f) => { const p = join(d, f); return f.startsWith("._") || f.startsWith(".") ? [] : statSync(p).isDirectory() ? walk(p) : [p]; });
let bad = 0, n = 0;
for (const f of walk(ROOT).filter((p) => /\.(html|js|css)$/.test(p))) {
  const s = readFileSync(f, "utf8");
  for (const m of s.matchAll(/(?:href|src|poster)=["']([^"'#?${}]+)[^"']*["']|url\(["']?([^"')#?${}]+)["']?\)/g)) {
    const u = m[1] || m[2];
    if (/^(https?:|mailto:|tel:|data:|\/\/|javascript:|%23|sms:|whatsapp:)/.test(u) || !u.trim()) continue;
    n++;
    if (!existsSync(resolve(dirname(f), u))) { bad++; console.log("MISSING", f.replace(ROOT, ""), "->", u); }
  }
}
console.log(bad ? `${bad} broken of ${n}` : `All ${n} relative links resolve`);
process.exitCode = bad ? 1 : 0;
