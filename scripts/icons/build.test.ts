import { describe, expect, it } from "vitest";
import { WEB_MANIFEST, buildIco, buildIconSvg } from "./build";

describe("buildIconSvg", () => {
  it("draws the mountain and the sun on the brand tile with the given corner radius", () => {
    const svg = buildIconSvg(7);
    expect(svg).toContain('rx="7"');
    expect(svg).toContain("<circle");
    expect(svg).toContain("<path");
    expect(buildIconSvg(0)).toContain('rx="0"');
  });
});

describe("buildIco", () => {
  const images = [
    { size: 16, png: Buffer.from("aaaa") },
    { size: 32, png: Buffer.from("bbbbbb") },
  ];
  const ico = buildIco(images);

  it("starts with the icon header and the number of images", () => {
    expect(ico.readUInt16LE(0)).toBe(0);
    expect(ico.readUInt16LE(2)).toBe(1);
    expect(ico.readUInt16LE(4)).toBe(2);
  });

  it("describes each image with its size, length and where its data starts", () => {
    const first = 6;
    const second = 6 + 16;
    expect(ico.readUInt8(first)).toBe(16);
    expect(ico.readUInt8(second)).toBe(32);
    expect(ico.readUInt32LE(first + 8)).toBe(4);
    expect(ico.readUInt32LE(second + 8)).toBe(6);
    const firstOffset = ico.readUInt32LE(first + 12);
    const secondOffset = ico.readUInt32LE(second + 12);
    expect(firstOffset).toBe(6 + 32);
    expect(secondOffset).toBe(firstOffset + 4);
    expect(ico.subarray(firstOffset, firstOffset + 4).toString()).toBe("aaaa");
    expect(ico.subarray(secondOffset, secondOffset + 6).toString()).toBe("bbbbbb");
  });

  it("writes 256 as zero, as the format wants", () => {
    const big = buildIco([{ size: 256, png: Buffer.from("x") }]);
    expect(big.readUInt8(6)).toBe(0);
  });
});

describe("WEB_MANIFEST", () => {
  it("names the site and points at icons that exist in public", () => {
    expect(WEB_MANIFEST.name).toBe("Dailyverse");
    expect(WEB_MANIFEST.icons.map((icon) => icon.src)).toEqual(["/icon-192.png", "/icon-512.png"]);
  });
});
