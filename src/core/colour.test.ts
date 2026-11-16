import { describe, expect, it } from "vitest";
import { shadeColour } from "./colour";

function lightnessOf(hex: string): number {
  const channels = [1, 3, 5].map((start) => parseInt(hex.slice(start, start + 2), 16) / 255);
  return (Math.max(...channels) + Math.min(...channels)) / 2;
}

describe("shadeColour", () => {
  it("returns the same colour for shade zero", () => {
    expect(shadeColour("#2f7d57", 0)).toBe("#2f7d57");
    expect(shadeColour("#ffffff", 0)).toBe("#ffffff");
    expect(shadeColour("#000000", 0)).toBe("#000000");
  });

  it("makes the colour lighter for a positive shade and darker for a negative one", () => {
    expect(lightnessOf(shadeColour("#2f7d57", 2))).toBeGreaterThan(lightnessOf("#2f7d57"));
    expect(lightnessOf(shadeColour("#2f7d57", -2))).toBeLessThan(lightnessOf("#2f7d57"));
  });

  it("changes lightness by about three percent per step", () => {
    const step = lightnessOf(shadeColour("#2f7d57", 1)) - lightnessOf("#2f7d57");
    expect(step).toBeGreaterThan(0.025);
    expect(step).toBeLessThan(0.035);
  });

  it("keeps the hue when shading", () => {
    const [red, green, blue] = [1, 3, 5].map((start) =>
      parseInt(shadeColour("#e07a3f", 2).slice(start, start + 2), 16),
    );
    expect(red).toBeGreaterThan(green);
    expect(green).toBeGreaterThan(blue);
  });

  it("stays valid at the ends of the range", () => {
    expect(shadeColour("#ffffff", 5)).toBe("#ffffff");
    expect(shadeColour("#000000", -5)).toBe("#000000");
    expect(shadeColour("#ffffff", -40)).toBe("#000000");
  });

  it("handles colours where red, green or blue is the largest channel", () => {
    ["#ff0000", "#00ff00", "#0000ff", "#ffff00", "#00ffff", "#ff00ff", "#808080"].forEach((hex) => {
      expect(shadeColour(hex, 0)).toBe(hex);
      expect(shadeColour(hex, 1)).toMatch(/^#[0-9a-f]{6}$/);
    });
  });
});
