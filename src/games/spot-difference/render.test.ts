import { describe, expect, it } from "vitest";
import { renderElement, renderSceneSvg } from "./render";
import { generateScene } from "./scene";
import type { SceneElement } from "./types";

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
      svg.startsWith('<g data-id="sun-1" transform="translate(100 90) rotate(10) scale(1.5)">'),
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
