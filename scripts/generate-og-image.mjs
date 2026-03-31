// Generates public/og-image.png (1200×630 — landscape for social previews)
// Run with: node scripts/generate-og-image.mjs
// Requires: npm install -D sharp

import { dirname, resolve } from "path";
import sharp from "sharp";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = resolve(__dirname, "../public/og-image.png");

const W = 1200;
const H = 630;
const CX = W / 2;

// Mountain — smaller: scale to 180px wide
const MTN_S  = 9;
const MTN_W  = 20 * MTN_S;       // 180
const MTN_H  = 13 * MTN_S;       // 117
const MTN_TX = (W - MTN_W) / 2;  // 510

// Title
const NAME_SIZE = 72;
const NAME_CAP  = Math.round(NAME_SIZE * 0.72); // ~52
const NAME_DESC = Math.round(NAME_SIZE * 0.20); // ~14

// Slogan
const SLOGAN_SIZE = 24;
const SLOGAN_CAP  = Math.round(SLOGAN_SIZE * 0.72); // ~17
const SLOGAN_LEAD = 36;

// Vertical layout: mountain → gap → title → gap → slogan, all centred in H
const GAP1    = 20;
const GAP2    = 28;
const BLOCK_H = MTN_H + GAP1 + NAME_CAP + NAME_DESC + GAP2 + SLOGAN_CAP + SLOGAN_LEAD + SLOGAN_CAP;
const MTN_TY   = Math.round((H - BLOCK_H) / 2);
const NAME_Y   = MTN_TY + MTN_H + GAP1 + NAME_CAP;
const SLOGAN1_Y = NAME_Y + NAME_DESC + GAP2 + SLOGAN_CAP;
const SLOGAN2_Y = SLOGAN1_Y + SLOGAN_LEAD;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">

  <!-- Background — exact same blue as the logo rect -->
  <rect width="${W}" height="${H}" fill="#2563eb"/>

  <!-- White mountain silhouette blended into background -->
  <g transform="translate(${MTN_TX},${MTN_TY}) scale(${MTN_S})">
    <path d="M0 13 L7 0 L11 6 L14 2 L20 13 Z" fill="white"/>
  </g>

  <!-- App name -->
  <text x="${CX}" y="${NAME_Y}"
        text-anchor="middle"
        font-family="'Segoe UI', Arial, Helvetica, sans-serif"
        font-size="${NAME_SIZE}" font-weight="700" fill="white" letter-spacing="-1">UtoTouren</text>

  <!-- Slogan -->
  <text x="${CX}" y="${SLOGAN1_Y}"
        text-anchor="middle"
        font-family="'Segoe UI', Arial, Helvetica, sans-serif"
        font-size="${SLOGAN_SIZE}" fill="#bfdbfe">Touren von sac-uto.ch suchen, filtern und</text>
  <text x="${CX}" y="${SLOGAN2_Y}"
        text-anchor="middle"
        font-family="'Segoe UI', Arial, Helvetica, sans-serif"
        font-size="${SLOGAN_SIZE}" fill="#bfdbfe">in Google Kalender oder als .ics exportieren</text>

</svg>`;

await sharp(Buffer.from(svg)).png().toFile(outPath);
// eslint-disable-next-line no-console
console.log(`Written: ${outPath}`);