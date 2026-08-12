// Generates the Pro app's icon + splash from the consumer brand assets.
// The Pro icon is the same premium monogram with a champagne-gold "PRO" banner
// across the lower edge, so the two apps are instantly distinguishable on a home
// screen while staying visibly part of the same family.
import sharp from "sharp";
import { mkdir, copyFile } from "node:fs/promises";

const SRC_ICON = "assets/icon-only.png";
const OUT_DIR = "assets-pro";

const SIZE = 1254; // square icon
const GOLD = "#D6A84F";
const GOLD_HI = "#F3D38A";
const INK = "#031A14"; // dark forest green (text on the gold banner)

// A gold banner ribbon sitting just inside the icon's lower border with "PRO".
const bannerH = Math.round(SIZE * 0.15);
const bannerY = Math.round(SIZE * 0.80);
const inset = Math.round(SIZE * 0.055); // clear of the icon's rounded gold frame
const radius = Math.round(bannerH * 0.28);
const overlay = Buffer.from(`
<svg width="${SIZE}" height="${SIZE}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${GOLD_HI}"/>
      <stop offset="1" stop-color="${GOLD}"/>
    </linearGradient>
  </defs>
  <rect x="${inset}" y="${bannerY}" width="${SIZE - inset * 2}" height="${bannerH}"
        rx="${radius}" ry="${radius}" fill="url(#g)"/>
  <text x="${SIZE / 2}" y="${bannerY + bannerH * 0.5}" text-anchor="middle"
        dominant-baseline="central" fill="${INK}"
        font-family="Georgia, 'Times New Roman', serif" font-weight="700"
        letter-spacing="${Math.round(bannerH * 0.14)}"
        font-size="${Math.round(bannerH * 0.62)}">PRO</text>
</svg>`);

await mkdir(OUT_DIR, { recursive: true });

await sharp(SRC_ICON)
  .composite([{ input: overlay, top: 0, left: 0 }])
  .png()
  .toFile(`${OUT_DIR}/icon-only.png`);

// Splash: the Pro app shares the dark forest-green splash art with the consumer app
// (config paints the background dark for both), so reuse it as-is.
await copyFile("assets/splash.png", `${OUT_DIR}/splash.png`);
await copyFile("assets/splash-dark.png", `${OUT_DIR}/splash-dark.png`);

console.log("Wrote", `${OUT_DIR}/icon-only.png`, "+ splash art");
