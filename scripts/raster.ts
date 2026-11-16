import { Resvg } from "@resvg/resvg-js";

export interface RasterImage {
  width: number;
  height: number;
  pixels: Uint8Array;
}

export function rasteriseSvg(svg: string | Buffer, width: number): RasterImage {
  const rendered = new Resvg(svg, { fitTo: { mode: "width", value: width } }).render();
  return { width: rendered.width, height: rendered.height, pixels: rendered.pixels };
}
