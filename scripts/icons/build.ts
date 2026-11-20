export const BRAND_GREEN = "#1f5f46";
export const BRAND_CREAM = "#fbf6ec";
export const BRAND_SUN = "#f2b632";

export function buildIconSvg(radius: number): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="${radius}" fill="${BRAND_GREEN}"/><circle cx="23" cy="10" r="3.4" fill="${BRAND_SUN}"/><path d="M3.5 25.5 13 10l5 8 3-4 7.5 11.5z" fill="${BRAND_CREAM}"/></svg>\n`;
}

export function buildIco(images: readonly { size: number; png: Buffer }[]): Buffer {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  const entries = Buffer.alloc(16 * images.length);
  const offsets = images.reduce<number[]>(
    (all, image, index) => [
      ...all,
      index === 0 ? header.length + entries.length : all[index - 1] + images[index - 1].png.length,
    ],
    [],
  );
  images.forEach((image, index) => {
    const at = index * 16;
    entries.writeUInt8(image.size >= 256 ? 0 : image.size, at);
    entries.writeUInt8(image.size >= 256 ? 0 : image.size, at + 1);
    entries.writeUInt16LE(1, at + 4);
    entries.writeUInt16LE(32, at + 6);
    entries.writeUInt32LE(image.png.length, at + 8);
    entries.writeUInt32LE(offsets[index], at + 12);
  });
  return Buffer.concat([header, entries, ...images.map((image) => image.png)]);
}

export const WEB_MANIFEST = {
  name: "Dailyverse",
  short_name: "Dailyverse",
  description: "Small daily games. A new puzzle every day.",
  start_url: "/",
  display: "standalone",
  background_color: BRAND_CREAM,
  theme_color: "#2a7a58",
  icons: [
    { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
    { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
  ],
};

export function buildSocialImageSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2f8460"/><stop offset="1" stop-color="#163629"/></linearGradient></defs><rect width="1200" height="630" fill="url(#g)"/><circle cx="1010" cy="150" r="64" fill="${BRAND_SUN}"/><circle cx="1010" cy="150" r="96" fill="${BRAND_SUN}" opacity="0.18"/><path d="M0 560 C200 470 360 590 560 520 S900 440 1200 540 V630 H0 Z" fill="#ffffff" opacity="0.12"/><path d="M0 590 C240 530 420 620 640 575 S980 520 1200 585 V630 H0 Z" fill="${BRAND_CREAM}"/><path d="M640 540 840 210 950 390 1010 310 1160 540z" fill="${BRAND_CREAM}" opacity="0.95"/><text x="80" y="250" font-family="Georgia, 'Times New Roman', serif" font-size="120" font-weight="700" fill="${BRAND_CREAM}">Dailyverse</text><text x="84" y="330" font-family="Helvetica, Arial, sans-serif" font-size="44" fill="${BRAND_CREAM}">Small daily games.</text><text x="84" y="390" font-family="Helvetica, Arial, sans-serif" font-size="44" fill="${BRAND_CREAM}">A new puzzle every day.</text></svg>
`;
}
