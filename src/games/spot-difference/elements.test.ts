import { PALETTES } from "./palettes";
import { describe, expect, it } from "vitest";
import { drawElement, VARIANT_COUNTS } from "./elements";
import { ELEMENT_KINDS, type ElementKind, type SceneElement } from "./types";

function element(kind: ElementKind, overrides: Partial<SceneElement> = {}): SceneElement {
  return {
    id: `${kind}-1`,
    kind,
    x: 0,
    y: 0,
    scale: 1,
    rotation: 0,
    shade: 0,
    variant: 0,
    layer: 1,
    ...overrides,
  };
}

describe("VARIANT_COUNTS", () => {
  it("has a positive count for every kind", () => {
    ELEMENT_KINDS.forEach((kind) => expect(VARIANT_COUNTS[kind]).toBeGreaterThan(0));
  });
});

describe("drawElement", () => {
  it("draws something for every kind and every variant", () => {
    ELEMENT_KINDS.forEach((kind) => {
      Array.from({ length: VARIANT_COUNTS[kind] }, (_, variant) => variant).forEach((variant) => {
        expect(drawElement(element(kind, { variant })).length).toBeGreaterThan(0);
      });
    });
  });

  it("draws the same thing every time", () => {
    ELEMENT_KINDS.forEach((kind) => {
      expect(drawElement(element(kind))).toEqual(drawElement(element(kind)));
    });
  });

  it("looks different for every variant of a kind", () => {
    ELEMENT_KINDS.forEach((kind) => {
      const drawings = Array.from({ length: VARIANT_COUNTS[kind] }, (_, variant) =>
        JSON.stringify(drawElement(element(kind, { variant }))),
      );
      expect(new Set(drawings).size).toBe(drawings.length);
    });
  });

  it("changes the colour when the shade changes, for kinds that use shade", () => {
    const shaded: ElementKind[] = [
      "pine",
      "roundTree",
      "bush",
      "tent",
      "rock",
      "flower",
      "mountain",
    ];
    shaded.forEach((kind) => {
      expect(JSON.stringify(drawElement(element(kind, { shade: 2 })))).not.toBe(
        JSON.stringify(drawElement(element(kind, { shade: 0 }))),
      );
    });
  });

  it("gives a pine more tiers for higher variants", () => {
    const tiers = (variant: number) => drawElement(element("pine", { variant })).length;
    expect(tiers(1)).toBe(tiers(0) + 1);
    expect(tiers(2)).toBe(tiers(0) + 2);
  });

  it("uses only valid hex colours", () => {
    ELEMENT_KINDS.forEach((kind) => {
      drawElement(element(kind, { shade: -1 })).forEach((primitive) => {
        expect(primitive.fill).toMatch(/^#[0-9a-f]{6}$/);
      });
    });
  });
});

describe("the desert and beach things", () => {
  const element = {
    id: "x-1",
    kind: "cactus" as const,
    x: 0,
    y: 0,
    scale: 1,
    rotation: 0,
    shade: 0,
    variant: 0,
    layer: 5,
  };

  it("gives a cactus a different shape for each variant", () => {
    const shapes = [0, 1, 2].map((variant) => JSON.stringify(drawElement({ ...element, variant })));
    expect(new Set(shapes).size).toBe(3);
  });

  it("leans a palm one way or the other by variant", () => {
    const palm = { ...element, kind: "palm" as const };
    expect(JSON.stringify(drawElement({ ...palm, variant: 0 }))).not.toBe(
      JSON.stringify(drawElement({ ...palm, variant: 1 })),
    );
  });

  it("draws the sun as a moon at night, and keeps it bright", () => {
    const sun = { ...element, kind: "sun" as const };
    const night = drawElement(sun, { palette: PALETTES.camp, mood: "night" });
    const day = drawElement(sun, { palette: PALETTES.camp, mood: "day" });
    expect(night.length).toBeGreaterThan(day.length);
    expect(night.every((part) => part.glow === true)).toBe(true);
  });

  it("dims the sun under cloud", () => {
    const sun = { ...element, kind: "sun" as const };
    const parts = drawElement(sun, { palette: PALETTES.camp, mood: "overcast" });
    expect(parts.every((part) => part.shape === "circle" && (part.opacity ?? 1) < 1)).toBe(true);
  });

  it("colours the trees of an autumn place by variant", () => {
    const tree = { ...element, kind: "roundTree" as const };
    const colours = [0, 1, 2].map((variant) =>
      drawElement({ ...tree, variant }, { palette: PALETTES.autumn, mood: "day" }),
    );
    const fills = colours.map((parts) => parts[parts.length - 1].fill);
    expect(new Set(fills).size).toBeGreaterThan(1);
  });
});
