import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { WEB_MANIFEST, buildIco, buildIconSvg, buildSocialImageSvg } from "./build";

const PUBLIC_DIR = fileURLToPath(new URL("../../public/", import.meta.url));
const ROUNDED = buildIconSvg(7);
const SQUARE = buildIconSvg(0);

async function renderPng(svg: string, size: number): Promise<Buffer> {
  return sharp(Buffer.from(svg), { density: 600 }).resize(size, size).png().toBuffer();
}

writeFileSync(`${PUBLIC_DIR}favicon.svg`, ROUNDED);
const ico = buildIco(
  await Promise.all(
    [16, 32, 48].map(async (size) => ({ size, png: await renderPng(ROUNDED, size) })),
  ),
);
writeFileSync(`${PUBLIC_DIR}favicon.ico`, ico);
writeFileSync(`${PUBLIC_DIR}apple-touch-icon.png`, await renderPng(SQUARE, 180));
writeFileSync(`${PUBLIC_DIR}icon-192.png`, await renderPng(SQUARE, 192));
writeFileSync(`${PUBLIC_DIR}icon-512.png`, await renderPng(SQUARE, 512));
writeFileSync(
  `${PUBLIC_DIR}og-image.png`,
  await sharp(Buffer.from(buildSocialImageSvg()), { density: 96 })
    .resize(1200, 630)
    .png()
    .toBuffer(),
);
writeFileSync(`${PUBLIC_DIR}site.webmanifest`, `${JSON.stringify(WEB_MANIFEST, null, 2)}\n`);
console.log("Wrote the icons and the web manifest into public/");
