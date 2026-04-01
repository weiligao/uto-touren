// Generates two OG images:
//   public/og-image.png        — 1200×630 landscape (Twitter/X, Facebook, LinkedIn)
//   public/og-image-square.png — 1200×1200 square   (WhatsApp)
// Run with: node scripts/generate-og-image.mjs
// Requires: npm install -D sharp

import { dirname, resolve } from "path";
import sharp from "sharp";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

function buildLandscapeSvg(W, H) {
  const CX = W / 2;

  // Mountain: scale so width ≈ 35% of canvas width
  const MTN_S  = (W * 0.35) / 20;
  const MTN_W  = 20 * MTN_S;
  const MTN_H  = 13 * MTN_S;
  const MTN_TX = (W - MTN_W) / 2;

  // Title: ~13% of canvas height
  const NAME_SIZE = Math.round(H * 0.13);
  const NAME_CAP  = Math.round(NAME_SIZE * 0.72);
  const NAME_DESC = Math.round(NAME_SIZE * 0.20);

  // Slogan: ~6% of canvas height
  const SLOGAN_SIZE = Math.round(H * 0.06);
  const SLOGAN_CAP  = Math.round(SLOGAN_SIZE * 0.72);

  const GAP1    = Math.round(H * 0.04);
  const GAP2    = Math.round(H * 0.05);
  const BLOCK_H = MTN_H + GAP1 + NAME_CAP + NAME_DESC + GAP2 + SLOGAN_CAP;
  const MTN_TY   = Math.round((H - BLOCK_H) / 2);
  const NAME_Y   = MTN_TY + MTN_H + GAP1 + NAME_CAP;
  const SLOGAN_Y = NAME_Y + NAME_DESC + GAP2 + SLOGAN_CAP;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <rect width="${W}" height="${H}" fill="#2563eb"/>
  <g transform="translate(${MTN_TX},${MTN_TY}) scale(${MTN_S})">
    <path d="M0 13 L7 0 L11 6 L14 2 L20 13 Z" fill="white"/>
  </g>
  <text x="${CX}" y="${NAME_Y}"
        text-anchor="middle"
        font-family="'Segoe UI', Arial, Helvetica, sans-serif"
        font-size="${NAME_SIZE}" font-weight="700" fill="white" letter-spacing="-1">UtoTouren</text>
  <text x="${CX}" y="${SLOGAN_Y}"
        text-anchor="middle"
        font-family="'Segoe UI', Arial, Helvetica, sans-serif"
        font-size="${SLOGAN_SIZE}" fill="#bfdbfe">SAC Uto Touren suchen, filtern und exportieren.</text>
</svg>`;
}

function buildSquareSvg(W) {
  // Replicate logo.svg proportions exactly (viewBox 32×32, translate(4,7.6) scale(1.2))
  const LOGO_SIZE = 32;
  const scale = W / LOGO_SIZE;
  const MTN_S  = 1.2 * scale;
  const MTN_TX = 4 * scale;
  const MTN_TY = 7.6 * scale;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${W}">
  <rect width="${W}" height="${W}" fill="#2563eb"/>
  <g transform="translate(${MTN_TX},${MTN_TY}) scale(${MTN_S})">
    <path d="M0 13 L7 0 L11 6 L14 2 L20 13 Z" fill="white"/>
  </g>
</svg>`;
}

async function generate(svg, filename) {
  const outPath = resolve(__dirname, `../public/${filename}`);
  try {
    await sharp(Buffer.from(svg)).png().toFile(outPath);
    // eslint-disable-next-line no-console
    console.log(`Written: ${outPath}`);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(`Failed to write ${filename}:`, err.message);
    process.exit(1);
  }
}

await generate(buildLandscapeSvg(1200, 630),  "og-image.png");
await generate(buildSquareSvg(1200),           "og-image-square.png");