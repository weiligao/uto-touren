// Generates public/og-image.png (1200x630)
// Run with: node scripts/generate-og-image.mjs
// Requires: npm install -D sharp

import { dirname, resolve } from "path";
import sharp from "sharp";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = resolve(__dirname, "../public/og-image.png");

// Icon size and position centered in 1200x630
const ICON = 320;
const x = (1200 - ICON) / 2;
const y = (630 - ICON) / 2;
const rx = (7 / 32) * ICON; // proportional corner radius

const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <rect width="1200" height="630" fill="#f9fafb"/>
  <rect x="${x}" y="${y}" width="${ICON}" height="${ICON}" rx="${rx}" fill="#2563eb"/>
  <g transform="translate(${x + (4 / 32) * ICON}, ${y + (7.6 / 32) * ICON}) scale(${(1.2 * ICON) / 32})">
    <path d="M0 13 L7 0 L11 6 L14 2 L20 13 Z" fill="white"/>
  </g>
</svg>`;

await sharp(Buffer.from(svg)).png().toFile(outPath);
console.log(`Written: ${outPath}`);