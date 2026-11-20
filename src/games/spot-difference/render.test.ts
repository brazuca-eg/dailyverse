import { describe, expect, it } from "vitest";
import { PALETTES } from "./palettes";
import { renderElement, renderSceneSvg } from "./render";
import { generateScene } from "./scene";
import { MOODS, type SceneElement } from "./types";

const sun: SceneElement = {
  id: "sun-1",
  kind: "sun",
  x: 100,
  y: 90,
  scale: 1.5,
  rotation: 10,
  shade: 0,
  variant: 0,
  layer: 1,
};

describe("renderElement", () => {
  it("wraps the drawing in a group with the element's id and placement", () => {
    const svg = renderElement(sun);
    expect(
      svg.startsWith('<g data-id="sun-1" transform="translate(100 90) rotate(10) scale(1.5 1.5)">'),
    ).toBe(true);
    expect(svg.endsWith("</g>")).toBe(true);
  });

  it("writes the opacity of a translucent part", () => {
    expect(renderElement(sun)).toContain('opacity="0.3"');
  });

  it("draws every kind of shape", () => {
    const tent = renderElement({ ...sun, kind: "tent", variant: 3 });
    const lake = renderElement({ ...sun, kind: "lake" });
    const pine = renderElement({ ...sun, kind: "pine" });
    expect(tent).toContain("<polygon");
    expect(tent).toContain("<rect");
    expect(lake).toContain("<ellipse");
    expect(pine).toContain("<rect");
    expect(renderElement(sun)).toContain("<circle");
  });
});

describe("renderSceneSvg", () => {
  const scene = generateScene(3);
  const svg = renderSceneSvg(scene);

  it("is a complete SVG with the canvas size as its view box", () => {
    expect(svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600"')).toBe(
      true,
    );
    expect(svg.endsWith("</svg>")).toBe(true);
  });

  it("has one group per element, each with its own id", () => {
    const ids = [...svg.matchAll(/data-id="([^"]+)"/g)].map((match) => match[1]);
    expect(ids).toEqual(scene.elements.map((element) => element.id));
  });

  it("draws the sky and the ground before the elements", () => {
    expect(svg.indexOf("<rect")).toBeLessThan(svg.indexOf("<g "));
  });

  it("looks the same every time for the same scene", () => {
    expect(renderSceneSvg(generateScene(3))).toBe(svg);
  });

  it("contains nothing that could run as script", () => {
    expect(svg).not.toMatch(/<script|javascript:|onload=|onclick=/i);
  });
});

describe("renderElement for a mirrored element", () => {
  it("turns the picture over by a negative width scale", () => {
    expect(renderElement({ ...sun, flip: true })).toContain("scale(-1.5 1.5)");
    expect(renderElement({ ...sun, flip: false })).toContain("scale(1.5 1.5)");
  });
});

describe("renderSceneSvg for times of day and places", () => {
  const base = generateScene(5);
  const render = (changes: Partial<typeof base>) => renderSceneSvg({ ...base, ...changes });

  it("draws stars only at night", () => {
    const stars = (svg: string) => (svg.match(/fill="#eef2ff"/g) ?? []).length;
    expect(stars(render({ mood: "night" }))).toBeGreaterThan(20);
    expect(stars(render({ mood: "day" }))).toBe(0);
    expect(stars(render({ mood: "sunset" }))).toBe(0);
  });

  it("draws the same stars every time for the same scene", () => {
    expect(render({ mood: "night" })).toBe(render({ mood: "night" }));
  });

  it("draws a sea only at the beach", () => {
    expect(render({ theme: "beach", mood: "day" })).toContain("#4fb3d9");
    expect(render({ theme: "camp", mood: "day" })).not.toContain("#4fb3d9");
  });

  it("paints the sky in bands at sunset and in one colour by day", () => {
    const skyRects = (svg: string) =>
      (svg.match(/<rect x="0" y="\d+" width="800" height="\d+"/g) ?? []).length;
    expect(skyRects(render({ mood: "day", theme: "camp" }))).toBe(2);
    expect(skyRects(render({ mood: "sunset", theme: "camp" }))).toBe(4);
  });

  it("keeps the flames and the moon bright at night, and colours everything else", () => {
    const fire = { ...sun, id: "campfire-1", kind: "campfire" as const };
    const dayFire = renderElement(fire, { palette: PALETTES.camp, mood: "day" });
    const nightFire = renderElement(fire, { palette: PALETTES.camp, mood: "night" });
    expect(nightFire).toContain("#f9d44a");
    expect(dayFire).toContain("#f9d44a");
    const nightTent = renderElement(
      { ...sun, id: "tent-1", kind: "tent" as const },
      { palette: PALETTES.camp, mood: "night" },
    );
    expect(nightTent).not.toContain("#e07a3f");
  });

  it("looks different for every mood", () => {
    const svgs = MOODS.map((mood) => render({ mood }));
    expect(new Set(svgs).size).toBe(MOODS.length);
  });
});
