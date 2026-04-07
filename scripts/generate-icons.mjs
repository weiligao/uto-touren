// Generates app icons for all platforms:
//   src/app/apple-icon.png — 180×180 for iOS home screen / Safari
//   src/app/icon-512.png   — 512×512 for Android PWA / splash screen
// Next.js picks up apple-icon.png automatically and emits:
//   <link rel="apple-touch-icon" href="/apple-icon.png">
// Run with: node scripts/generate-icons.mjs

import { dirname, resolve } from "path";
import sharp from "sharp";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Replicates icon.svg proportions exactly (viewBox 32×32, translate(4,7.6) scale(1.2))
function buildSvg(size) {
  const scale = size / 32;
  const MTN_S  = 1.2 * scale;
  const MTN_TX = 4 * scale;
  const MTN_TY = 7.6 * scale;
  const RX = 7 * scale; // same corner-radius ratio as icon.svg
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
  <rect width="${size}" height="${size}" rx="${RX}" fill="#2563eb"/>
  <g transform="translate(${MTN_TX},${MTN_TY}) scale(${MTN_S})">
    <path d="M0 13 L7 0 L11 6 L14 2 L20 13 Z" fill="white"/>
  </g>
</svg>`;
}

async function generate(size, filename, dir = "../src/app") {
  const outPath = resolve(__dirname, `${dir}/${filename}`);
  try {
    await sharp(Buffer.from(buildSvg(size))).png().toFile(outPath);
    // eslint-disable-next-line no-console
    console.log(`Written: ${outPath}`);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(`Failed to write ${filename}:`, err.message);
    process.exit(1);
  }
}

await generate(180, "apple-icon.png");          // src/app/ — Next.js serves as apple-touch-icon
await generate(512, "icon-512.png", "../public"); // public/  — referenced by manifest.ts
