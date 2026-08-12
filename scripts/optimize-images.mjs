import sharp from "sharp";
import { readdirSync, readFileSync, writeFileSync } from "fs";
const dir = "public/property-images";
let before = 0, after = 0;
for (const f of readdirSync(dir)) {
  if (!/\.png$/i.test(f)) continue;
  const p = `${dir}/${f}`;
  const orig = readFileSync(p);
  before += orig.length;
  const out = await sharp(orig)
    .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
    .png({ quality: 82, effort: 9, palette: true })
    .toBuffer();
  writeFileSync(p, out);
  after += out.length;
}
console.log(`before ${(before/1e6).toFixed(1)}MB -> after ${(after/1e6).toFixed(1)}MB (${Math.round((1-after/before)*100)}% smaller)`);
