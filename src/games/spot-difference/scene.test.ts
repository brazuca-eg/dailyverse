import { describe, expect, it } from "vitest";
import { VARIANT_COUNTS } from "./elements";
import { boundsOverlap, isInside, measureElement } from "./geometry";
import { SCENE_HEIGHT, SCENE_WIDTH, THEME_RECIPES } from "./recipes";
import { generateScene } from "./scene";
import { ELEMENT_KINDS, MOODS, THEMES } from "./types";

const SEEDS = Array.from({ length: 120 }, (_, seed) => seed);
const MIN_ELEMENTS = 28;
const SKY_LAYER = 1;
const BIRD_LAYER = 6;
const GROUND_LAYER = 5;

describe("generateScene", () => {
  it("makes the same scene for the same seed", () => {
    expect(generateScene(42)).toEqual(generateScene(42));
  });

  it("makes different scenes for different seeds", () => {
    const scenes = SEEDS.map((seed) => JSON.stringify(generateScene(seed)));
    expect(new Set(scenes).size).toBe(SEEDS.length);
  });

  it("uses every theme, spread across consecutive seeds", () => {
    const themes = SEEDS.map((seed) => generateScene(seed).theme);
    THEMES.forEach((theme) => {
      expect(themes.filter((candidate) => candidate === theme).length).toBeGreaterThan(
        SEEDS.length / (THEMES.length * 2),
      );
    });
  });

  it("uses every time of day, with day light the most common", () => {
    const moods = SEEDS.map((seed) => generateScene(seed).mood);
    MOODS.forEach((mood) => {
      expect(moods.filter((candidate) => candidate === mood).length).toBeGreaterThan(0);
    });
    const count = (mood: string) => moods.filter((candidate) => candidate === mood).length;
    expect(count("day")).toBeGreaterThan(count("night"));
  });

  it("mixes places and times of day, so neighbouring days look different", () => {
    const looks = Array.from({ length: 60 }, (_, seed) => {
      const { theme, mood } = generateScene(seed);
      return `${theme}/${mood}`;
    });
    expect(new Set(looks).size).toBeGreaterThanOrEqual(20);
  });

  it("does not repeat the same theme many days in a row", () => {
    const themes = Array.from({ length: 200 }, (_, seed) => generateScene(seed).theme);
    const longestRun = themes.reduce(
      (best, theme, index) => {
        const length = index > 0 && themes[index - 1] === theme ? best.length + 1 : 1;
        return { length, longest: Math.max(best.longest, length) };
      },
      { length: 0, longest: 0 },
    ).longest;
    expect(longestRun).toBeLessThanOrEqual(5);
    expect(new Set(themes.slice(0, 10)).size).toBeGreaterThanOrEqual(3);
  });

  it("remembers its seed and the canvas size", () => {
    const scene = generateScene(7);
    expect(scene.seed).toBe(7);
    expect(scene.width).toBe(SCENE_WIDTH);
    expect(scene.height).toBe(SCENE_HEIGHT);
  });

  it("fills the scene densely enough to hide small differences", () => {
    SEEDS.forEach((seed) => {
      expect(generateScene(seed).elements.length).toBeGreaterThanOrEqual(MIN_ELEMENTS);
    });
  });

  it("gives every element a unique id that starts with its kind", () => {
    SEEDS.forEach((seed) => {
      const { elements } = generateScene(seed);
      expect(new Set(elements.map((element) => element.id)).size).toBe(elements.length);
      elements.forEach((element) => expect(element.id.startsWith(`${element.kind}-`)).toBe(true));
    });
  });

  it("never needs more of a kind than its theme allows", () => {
    SEEDS.forEach((seed) => {
      const scene = generateScene(seed);
      THEME_RECIPES[scene.theme].forEach((recipe) => {
        const count = scene.elements.filter((element) => element.kind === recipe.kind).length;
        expect(count).toBeLessThanOrEqual(recipe.max);
      });
    });
  });

  it("includes a sun, and some birds and clouds, in every scene", () => {
    SEEDS.forEach((seed) => {
      const kinds = generateScene(seed).elements.map((element) => element.kind);
      expect(kinds).toContain("sun");
      expect(kinds).toContain("bird");
      expect(kinds).toContain("cloud");
    });
  });

  it("uses only variants and shades each kind can draw", () => {
    SEEDS.forEach((seed) => {
      generateScene(seed).elements.forEach((element) => {
        expect(element.variant).toBeGreaterThanOrEqual(0);
        expect(element.variant).toBeLessThan(VARIANT_COUNTS[element.kind]);
        expect([-1, 0, 1]).toContain(element.shade);
        expect(element.rotation).toBe(0);
      });
    });
  });

  it("lists elements back to front so nearer things draw over farther ones", () => {
    SEEDS.forEach((seed) => {
      const { elements } = generateScene(seed);
      elements.slice(1).forEach((element, index) => {
        const previous = elements[index];
        expect(
          element.layer > previous.layer ||
            (element.layer === previous.layer && element.y >= previous.y),
        ).toBe(true);
      });
    });
  });

  it("keeps ground and sky items inside the picture, away from the edge", () => {
    SEEDS.forEach((seed) => {
      generateScene(seed)
        .elements.filter((element) => [SKY_LAYER, BIRD_LAYER, GROUND_LAYER].includes(element.layer))
        .forEach((element) => {
          expect(isInside(measureElement(element), SCENE_WIDTH, SCENE_HEIGHT, 6)).toBe(true);
        });
    });
  });

  it("never lets two ground items overlap, so each can be told apart", () => {
    SEEDS.forEach((seed) => {
      const ground = generateScene(seed).elements.filter(
        (element) => element.layer === GROUND_LAYER,
      );
      ground.forEach((first, index) => {
        ground.slice(index + 1).forEach((second) => {
          expect(boundsOverlap(measureElement(first), measureElement(second))).toBe(false);
        });
      });
    });
  });

  it("keeps ground items out of the lake", () => {
    SEEDS.forEach((seed) => {
      const { elements } = generateScene(seed);
      const lake = elements.find((element) => element.kind === "lake");
      if (lake) {
        elements
          .filter((element) => element.layer === GROUND_LAYER)
          .forEach((element) => {
            expect(boundsOverlap(measureElement(element), measureElement(lake))).toBe(false);
          });
      }
    });
  });

  it("makes things nearer the viewer bigger", () => {
    const trees = SEEDS.flatMap((seed) =>
      generateScene(seed).elements.filter((element) => element.kind === "pine"),
    );
    const near = trees.filter((tree) => tree.y > 520).map((tree) => tree.scale);
    const far = trees.filter((tree) => tree.y < 440).map((tree) => tree.scale);
    const average = (values: number[]) =>
      values.reduce((sum, value) => sum + value, 0) / values.length;
    expect(average(near)).toBeGreaterThan(average(far));
  });
});

describe("the places and things of the scenes", () => {
  const scenes = Array.from({ length: 200 }, (_, seed) => generateScene(seed));

  it("uses every kind of thing somewhere", () => {
    const used = new Set(scenes.flatMap((scene) => scene.elements.map((element) => element.kind)));
    ELEMENT_KINDS.forEach((kind) => expect(used.has(kind)).toBe(true));
  });

  it("puts boats and ducks on the water and umbrellas on the beach only", () => {
    scenes.forEach((scene) => {
      const kinds = scene.elements.map((element) => element.kind);
      if (kinds.includes("duck")) {
        expect(scene.theme).toBe("lake");
      }
      if (kinds.includes("umbrella")) {
        expect(scene.theme).toBe("beach");
      }
      if (kinds.includes("snowman")) {
        expect(scene.theme).toBe("winter");
      }
      if (kinds.includes("windmill") || kinds.includes("barn")) {
        expect(scene.theme).toBe("countryside");
      }
    });
  });

  it("keeps balloons high in the sky", () => {
    scenes
      .flatMap((scene) => scene.elements)
      .filter((element) => element.kind === "balloon")
      .forEach((element) => expect(element.y).toBeLessThan(220));
  });

  it("does not let things overlap in the crowded places", () => {
    scenes.slice(0, 40).forEach((scene) => {
      const crowd = scene.elements.filter((element) => element.layer === 5);
      crowd.forEach((first, index) => {
        crowd.slice(index + 1).forEach((second) => {
          expect(boundsOverlap(measureElement(first), measureElement(second), 0)).toBe(false);
        });
      });
    });
  });
});
