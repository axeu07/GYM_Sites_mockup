// Re-tints leftover cool/violet greys (the old neon palette) to warm neutrals of the same lightness.
// Only touches low-saturation colours whose blue channel leads red: accents are left alone.
// Usage: node media/warm-hex.mjs <file…>
import { readFileSync, writeFileSync } from "node:fs";
const hex = (n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0").toUpperCase();
for (const f of process.argv.slice(2)) {
  let n = 0;
  const out = readFileSync(f, "utf8").replace(/#([0-9a-fA-F]{6})\b/g, (m, h) => {
    const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    if (!(b > r + 3 && b >= g) || max - min > 70) return m; // warm already, or a real accent colour
    const L = 0.3 * r + 0.59 * g + 0.11 * b;
    n++; return `#${hex(L * 1.03 + 1)}${hex(L)}${hex(L * 0.93 - 1)}`;
  }).replace(/rgba\((\d+), (\d+), (\d+),/g, (m, r, g, b) => {
    [r, g, b] = [r, g, b].map(Number);
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    if (!(b > r + 3 && b >= g) || max - min > 70) return m;
    const L = 0.3 * r + 0.59 * g + 0.11 * b; n++;
    return `rgba(${Math.round(Math.min(255, L * 1.03 + 1))}, ${Math.round(L)}, ${Math.round(Math.max(0, L * 0.93 - 1))},`;
  });
  writeFileSync(f, out); console.log(f, n, "colours warmed");
}
