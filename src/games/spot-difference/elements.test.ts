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
