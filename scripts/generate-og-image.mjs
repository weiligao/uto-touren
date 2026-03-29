// Generates public/og-image.png (1200x630)
// Run with: node scripts/generate-og-image.mjs
// Requires: npm install -D sharp

import { dirname, resolve } from "path";
import sharp from "sharp";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = resolve(__dirname, "../public/og-image.png");

const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <!-- Background -->
  <rect width="1200" height="630" fill="#f9fafb"/>

  <!-- Left accent bar -->
  <rect x="0" y="0" width="8" height="630" fill="#2563eb"/>

  <!-- Card -->
  <rect x="80" y="100" width="1040" height="430" rx="16" fill="white"
        filter="url(#shadow)"/>
  <defs>
    <filter id="shadow" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="0" dy="4" stdDeviation="12" flood-color="#00000018"/>
    </filter>
  </defs>

  <!-- Logo icon — matches logo.svg exactly (scaled 2.5× from 32×32 viewBox) -->
  <!-- rx: 7*2.5=17.5; translate: (4*2.5, 7.6*2.5)=(10,19)→absolute(130,179); scale: 1.2*2.5=3.0 -->
  <rect x="120" y="160" width="80" height="80" rx="17.5" fill="#2563eb"/>
  <g transform="translate(130, 179) scale(3.0)">
    <path d="M0 13 L7 0 L11 6 L14 2 L20 13 Z" fill="white"/>
  </g>

  <!-- App name — vertically centered with logo rect (y=160, h=80 → center=200) -->
  <text x="224" y="200" dominant-baseline="central"
        font-family="system-ui, -apple-system, sans-serif"
        font-size="56" font-weight="700" fill="#111827">UtoTouren</text>

  <!-- Tagline -->
  <text x="120" y="296" font-family="system-ui, -apple-system, sans-serif"
        font-size="28" fill="#6b7280">
    Touren der SAC-Sektion Uto suchen, filtern und exportieren
  </text>

  <!-- Divider -->
  <line x1="120" y1="340" x2="1080" y2="340" stroke="#e5e7eb" stroke-width="1.5"/>

  <!-- Feature pills -->
  <!-- Pill center y = 370 + 24 = 394 -->
  <!-- Pill 1: Search — icon 21×20px, text ~65px → content ~94px, half=47 → icon x=183, text x=212 -->
  <rect x="120" y="370" width="220" height="48" rx="24" fill="#eff6ff"/>
  <g transform="translate(183, 384)">
    <!-- icon spans y 0–20, vertically centered at 394: translate_y=394-10=384 -->
    <circle cx="9" cy="8" r="8" fill="none" stroke="#2563eb" stroke-width="2"/>
    <line x1="15" y1="14" x2="21" y2="20" stroke="#2563eb" stroke-width="2.5" stroke-linecap="round"/>
  </g>
  <text x="212" y="394" dominant-baseline="central"
        font-family="system-ui, -apple-system, sans-serif"
        font-size="22" fill="#2563eb">Suchen</text>

  <!-- Pill 2: Calendar — icon 20×19px, text ~146px → content ~174px, half=87 → icon x=393, text x=421 -->
  <rect x="360" y="370" width="240" height="48" rx="24" fill="#eff6ff"/>
  <g transform="translate(393, 384)">
    <!-- icon spans y 0–19, vertically centered at 394: translate_y=394-9.5≈384 -->
    <rect x="0" y="3" width="20" height="16" rx="2" fill="none" stroke="#2563eb" stroke-width="1.8"/>
    <line x1="0" y1="9" x2="20" y2="9" stroke="#2563eb" stroke-width="1.8"/>
    <line x1="6" y1="0" x2="6" y2="6" stroke="#2563eb" stroke-width="2" stroke-linecap="round"/>
    <line x1="14" y1="0" x2="14" y2="6" stroke="#2563eb" stroke-width="2" stroke-linecap="round"/>
  </g>
  <text x="421" y="394" dominant-baseline="central"
        font-family="system-ui, -apple-system, sans-serif"
        font-size="22" fill="#2563eb">Kalenderansicht</text>

  <!-- Pill 3: Download — icon 16×18px, text ~138px → content ~162px, half=81 → icon x=669, text x=693 -->
  <rect x="620" y="370" width="260" height="48" rx="24" fill="#eff6ff"/>
  <g transform="translate(669, 385)">
    <!-- icon spans y 0–18, vertically centered at 394: translate_y=394-9=385 -->
    <line x1="9" y1="0" x2="9" y2="13" stroke="#2563eb" stroke-width="2" stroke-linecap="round"/>
    <polyline points="3,8 9,14 15,8" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <line x1="2" y1="18" x2="16" y2="18" stroke="#2563eb" stroke-width="2" stroke-linecap="round"/>
  </g>
  <text x="693" y="394" dominant-baseline="central"
        font-family="system-ui, -apple-system, sans-serif"
        font-size="22" fill="#2563eb">.ics exportieren</text>

  <!-- Source note -->
  <text x="1080" y="490" text-anchor="end"
        font-family="system-ui, -apple-system, sans-serif"
        font-size="20" fill="#9ca3af">Datenquelle: sac-uto.ch</text>
</svg>
`;

await sharp(Buffer.from(svg)).png().toFile(outPath);
console.log(`og-image.png written to ${outPath}`);
