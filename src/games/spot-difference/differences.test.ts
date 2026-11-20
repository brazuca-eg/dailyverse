import { describe, expect, it } from "vitest";
import { createRandom } from "../../core/random";
import { DIFFICULTIES, type Difficulty } from "../../core/difficulty";
import { alterElement, ELIGIBLE_KINDS, planDifferences, type DifferencePlan } from "./differences";
import { TIER_PROFILES } from "./difficulty";
import { drawElement, TENT_COLOURS, VARIANT_COUNTS } from "./elements";
import { boundsOverlap, measureElement } from "./geometry";
import { CROWD_BY_LAYER, SCENE_HEIGHT, SCENE_WIDTH } from "./recipes";
import { MOOD_SHADE_BOOST, PALETTES } from "./palettes";
import { generateScene } from "./scene";
import {
  DIFFERENCE_KINDS,
  type DifferenceKind,
  type ElementKind,
  type Scene,
  type SceneElement,
  type SceneMood,
} from "./types";

const SEEDS = Array.from({ length: 30 }, (_, seed) => seed);
const hard = TIER_PROFILES.hard;

function element(kind: ElementKind, overrides: Partial<SceneElement> = {}): SceneElement {
  return {
    id: `${kind}-1`,
    kind,
    x: 400,
    y: 450,
    scale: 1,
    rotation: 0,
    shade: 0,
    variant: 0,
    layer: 5,
    ...overrides,
  };
}

function eligibleKinds(kind: DifferenceKind): ElementKind[] {
  return [...ELIGIBLE_KINDS[kind]];
}

describe("alterElement", () => {
  it("removes an element by returning nothing", () => {
    expect(alterElement(element("pine"), "remove", hard, createRandom(1))).toBeNull();
  });

  it("moves an element by a distance inside the tier's range and changes nothing else", () => {
    const pine = element("pine");
    SEEDS.forEach((seed) => {
      const moved = alterElement(pine, "move", hard, createRandom(seed)) as SceneElement;
      const distance = Math.hypot(moved.x - pine.x, moved.y - pine.y);
      expect(distance).toBeGreaterThanOrEqual(hard.moveDistance[0] - 0.2);
      expect(distance).toBeLessThanOrEqual(hard.moveDistance[1] + 0.2);
      expect({ ...moved, x: 0, y: 0 }).toEqual({ ...pine, x: 0, y: 0 });
    });
  });

  it("moves in different directions for different draws", () => {
    const angles = SEEDS.map((seed) => {
      const moved = alterElement(element("pine"), "move", hard, createRandom(seed)) as SceneElement;
      return Math.sign(moved.x - 400);
    });
    expect(new Set(angles).size).toBeGreaterThan(1);
  });

  it("resizes by a share inside the tier's range, both bigger and smaller", () => {
    const signs = SEEDS.map((seed) => {
      const resized = alterElement(
        element("rock", { scale: 1 }),
        "resize",
        hard,
        createRandom(seed),
      ) as SceneElement;
      const share = Math.abs(resized.scale - 1);
      expect(share).toBeGreaterThanOrEqual(hard.resizeShare[0] - 0.005);
      expect(share).toBeLessThanOrEqual(hard.resizeShare[1] + 0.005);
      return Math.sign(resized.scale - 1);
    });
    expect(new Set(signs)).toEqual(new Set([-1, 1]));
  });

  it("shifts the shade by exactly the tier's number of steps, up or down", () => {
    const deltas = SEEDS.map((seed) => {
      const shaded = alterElement(
        element("pine", { shade: 1 }),
        "reshade",
        hard,
        createRandom(seed),
      ) as SceneElement;
      return shaded.shade - 1;
    });
    expect(new Set(deltas)).toEqual(new Set([-hard.shadeSteps, hard.shadeSteps]));
  });

  it("changes the variant, to one that exists, for every kind that allows it", () => {
    eligibleKinds("revariant").forEach((kind) => {
      Array.from({ length: VARIANT_COUNTS[kind] }, (_, variant) => variant).forEach((variant) => {
        const changed = alterElement(
          element(kind, { variant }),
          "revariant",
          hard,
          createRandom(1),
        ) as SceneElement;
        expect(changed.variant).not.toBe(variant);
        expect(changed.variant).toBeGreaterThanOrEqual(0);
        expect(changed.variant).toBeLessThan(VARIANT_COUNTS[kind]);
      });
    });
  });

  it("changes a round tree in one place only, by one blob", () => {
    [0, 1, 2].forEach((variant) => {
      const before = drawElement(element("roundTree", { variant }));
      const changed = alterElement(
        element("roundTree", { variant }),
        "revariant",
        hard,
        createRandom(1),
      ) as SceneElement;
      expect(Math.abs(drawElement(changed).length - before.length)).toBe(1);
    });
  });

  it("keeps a tent's colour and a flower's petal colour when changing the variant", () => {
    Array.from({ length: VARIANT_COUNTS.tent }, (_, variant) => variant).forEach((variant) => {
      const changed = alterElement(
        element("tent", { variant }),
        "revariant",
        hard,
        createRandom(1),
      ) as SceneElement;
      expect(changed.variant % TENT_COLOURS.length).toBe(variant % TENT_COLOURS.length);
    });
    Array.from({ length: VARIANT_COUNTS.flower }, (_, variant) => variant).forEach((variant) => {
      const changed = alterElement(
        element("flower", { variant }),
        "revariant",
        hard,
        createRandom(1),
      ) as SceneElement;
      expect(Math.floor(changed.variant / 4)).toBe(Math.floor(variant / 4));
    });
  });

  it("gives the same result for the same draw", () => {
    DIFFERENCE_KINDS.forEach((kind) => {
      expect(alterElement(element("pine"), kind, hard, createRandom(9))).toEqual(
        alterElement(element("pine"), kind, hard, createRandom(9)),
      );
    });
  });
});

describe("planDifferences", () => {
  const plans = SEEDS.flatMap((seed) =>
    DIFFICULTIES.map((tier) => {
      const scene = generateScene(seed);
      return { scene, tier, plan: planDifferences(scene, tier, createRandom(seed + 1)) };
    }),
  );
  const found = plans.flatMap((entry) => (entry.plan ? [{ ...entry, plan: entry.plan }] : []));

  it("finds a plan for nearly every scene and tier", () => {
    expect(found.length).toBeGreaterThanOrEqual(plans.length * 0.8);
  });

  it("plans exactly five differences on five different elements", () => {
    found.forEach(({ scene, plan }) => {
      expect(plan.differences).toHaveLength(5);
      const ids = plan.differences.map((difference) => difference.id);
      expect(new Set(ids).size).toBe(5);
      ids.forEach((id) =>
        expect(scene.elements.some((candidate) => candidate.id === id)).toBe(true),
      );
    });
  });

  it("mixes the kinds of difference: no kind more than twice, at least three kinds", () => {
    found.forEach(({ plan }) => {
      const kinds = plan.differences.map((difference) => difference.kind);
      expect(new Set(kinds).size).toBeGreaterThanOrEqual(3);
      DIFFERENCE_KINDS.forEach((kind) => {
        expect(kinds.filter((candidate) => candidate === kind).length).toBeLessThanOrEqual(2);
      });
    });
  });

  it("changes only the chosen elements and leaves every other element exactly as it was", () => {
    found.forEach(({ scene, plan }) => {
      const changedIds = new Set(plan.differences.map((difference) => difference.id));
      scene.elements
        .filter((candidate) => !changedIds.has(candidate.id))
        .forEach((untouched) => {
          expect(plan.altered.elements).toContainEqual(untouched);
        });
      const removed = plan.differences.filter((difference) => difference.kind === "remove").length;
      expect(plan.altered.elements).toHaveLength(scene.elements.length - removed);
    });
  });

  it("really changes each chosen element", () => {
    found.forEach(({ scene, plan }) => {
      plan.differences.forEach((difference) => {
        const before = scene.elements.find((candidate) => candidate.id === difference.id);
        const after = plan.altered.elements.find((candidate) => candidate.id === difference.id);
        if (difference.kind === "remove") {
          expect(after).toBeUndefined();
        } else if (difference.kind === "add") {
          expect(after).toEqual(before);
          expect(plan.original.elements.some((candidate) => candidate.id === difference.id)).toBe(
            false,
          );
        } else {
          expect(after).not.toEqual(before);
        }
      });
    });
  });

  it("keeps the differences apart so each is a separate thing to find", () => {
    found.forEach(({ plan }) => {
      plan.differences.forEach((first, index) => {
        plan.differences.slice(index + 1).forEach((second) => {
          expect(boundsOverlap(first.region, second.region, 16)).toBe(false);
        });
      });
    });
  });

  it("keeps every difference away from the edge of the picture", () => {
    found.forEach(({ plan }) => {
      plan.differences.forEach(({ region }) => {
        expect(region.left).toBeGreaterThanOrEqual(0);
        expect(region.top).toBeGreaterThanOrEqual(0);
        expect(region.right).toBeLessThanOrEqual(SCENE_WIDTH);
        expect(region.bottom).toBeLessThanOrEqual(SCENE_HEIGHT);
      });
    });
  });

  it("only targets elements in the size range of the tier", () => {
    found.forEach(({ scene, tier, plan }) => {
      const profile = TIER_PROFILES[tier];
      plan.differences.forEach((difference) => {
        const target = scene.elements.find(
          (candidate) => candidate.id === difference.id,
        ) as SceneElement;
        const bounds = measureElement(target);
        const area = (bounds.right - bounds.left) * (bounds.bottom - bounds.top);
        expect(area).toBeGreaterThanOrEqual(profile.minTargetArea);
        expect(area).toBeLessThanOrEqual(profile.maxTargetArea);
      });
    });
  });

  it("only uses kinds that suit each difference", () => {
    found.forEach(({ scene, plan }) => {
      plan.differences.forEach((difference) => {
        const target = scene.elements.find(
          (candidate) => candidate.id === difference.id,
        ) as SceneElement;
        expect(ELIGIBLE_KINDS[difference.kind]).toContain(target.kind);
      });
    });
  });

  it("does not let a changed element land on top of a neighbour", () => {
    found.forEach(({ plan }) => {
      const ground = plan.altered.elements.filter(
        (candidate) => CROWD_BY_LAYER[candidate.layer] === "ground",
      );
      ground.forEach((first, index) => {
        ground.slice(index + 1).forEach((second) => {
          expect(boundsOverlap(measureElement(first), measureElement(second))).toBe(false);
        });
      });
    });
  });

  it("keeps the altered scene in drawing order", () => {
    found.forEach(({ plan }) => {
      plan.altered.elements.slice(1).forEach((current, index) => {
        const previous = plan.altered.elements[index];
        expect(
          current.layer > previous.layer ||
            (current.layer === previous.layer && current.y >= previous.y),
        ).toBe(true);
      });
    });
  });

  it("gives the same plan for the same draw", () => {
    const scene = generateScene(4);
    expect(planDifferences(scene, "hard", createRandom(5))).toEqual(
      planDifferences(scene, "hard", createRandom(5)),
    );
  });

  it("gives up when the scene has nothing it can change", () => {
    const empty = { ...generateScene(1), elements: [] };
    expect(planDifferences(empty, "hard", createRandom(1))).toBeNull();
  });
});

function planWithRetries(scene: Scene, tier: Difficulty, attempt = 0): DifferencePlan | null {
  const plan = planDifferences(scene, tier, createRandom(scene.seed * 101 + attempt + 1));
  return plan ?? (attempt < 39 ? planWithRetries(scene, tier, attempt + 1) : null);
}

describe("planDifferences in every place and at every time of day", () => {
  const scenes = Array.from({ length: 80 }, (_, seed) => generateScene(seed));

  it("finds five differences for every place and time of day, at every tier, within a few tries", () => {
    scenes.forEach((scene) => {
      DIFFICULTIES.forEach((tier) => {
        const plan = planWithRetries(scene, tier);
        expect(plan?.differences ?? []).toHaveLength(5);
      });
    });
  });

  it("uses the colours of the place to find what changed in a tree that changes colour", () => {
    const autumn = { ...generateScene(1), theme: "autumn" as const, mood: "day" as const };
    const tree = element("roundTree", { variant: 0 });
    const scene = { ...autumn, elements: [tree] };
    const colourOf = (variant: number) =>
      drawElement({ ...tree, variant }, { palette: PALETTES.autumn, mood: "day" }).map(
        (part) => part.fill,
      );
    expect(colourOf(0)[1]).not.toBe(colourOf(1)[1]);
    expect(scene.elements).toHaveLength(1);
  });

  it("makes the colour steps bigger where the light hides them", () => {
    const steps = (mood: SceneMood) =>
      scenes
        .filter((scene) => scene.mood === mood)
        .flatMap((scene) => {
          const plan = planDifferences(scene, "hard", createRandom(scene.seed + 5));
          return (plan?.differences ?? [])
            .filter((difference) => difference.kind === "reshade")
            .map((difference) => {
              const before = scene.elements.find((candidate) => candidate.id === difference.id);
              const after = plan?.altered.elements.find(
                (candidate) => candidate.id === difference.id,
              );
              return Math.abs((after?.shade ?? 0) - (before?.shade ?? 0));
            });
        });
    expect(new Set(steps("day"))).toEqual(new Set([TIER_PROFILES.hard.shadeSteps]));
    const night = Math.round(TIER_PROFILES.hard.shadeSteps * MOOD_SHADE_BOOST.night);
    expect(steps("night").length).toBeGreaterThan(0);
    expect(new Set(steps("night"))).toEqual(new Set([night]));
  });

  it("does not ask the player to spot a tiny flower changing shape in the dark", () => {
    scenes
      .filter((scene) => scene.mood === "night")
      .forEach((scene) => {
        const plan = planDifferences(scene, "hard", createRandom(scene.seed + 3));
        const flowerShapes = (plan?.differences ?? []).filter((difference) => {
          const original = scene.elements.find((candidate) => candidate.id === difference.id);
          return original?.kind === "flower" && difference.kind === "revariant";
        });
        expect(flowerShapes).toEqual([]);
      });
  });

  it("only offers a resize that is big enough to see in the light of the scene", () => {
    scenes.forEach((scene) => {
      const plan = planDifferences(scene, "hard", createRandom(scene.seed + 9));
      (plan?.differences ?? [])
        .filter((difference) => difference.kind === "resize")
        .forEach((difference) => {
          const original = scene.elements.find((candidate) => candidate.id === difference.id);
          const bounds = original ? measureElement(original) : null;
          const area = bounds ? (bounds.right - bounds.left) * (bounds.bottom - bounds.top) : 0;
          expect(
            (area * TIER_PROFILES.hard.resizeShare[0]) / MOOD_SHADE_BOOST[scene.mood],
          ).toBeGreaterThanOrEqual(30);
        });
    });
  });
});

describe("the new kinds of difference", () => {
  const deer = element("deer", { x: 300, y: 480 });

  it("mirrors an element, and mirrors it back the second time", () => {
    const once = alterElement(deer, "mirror", hard, createRandom(1));
    expect(once?.flip).toBe(true);
    const twice = alterElement(once as SceneElement, "mirror", hard, createRandom(1));
    expect(twice?.flip).toBe(false);
    expect(once).toEqual({ ...deer, flip: true });
  });

  it("keeps the place and size of a mirrored element", () => {
    const mirrored = alterElement(deer, "mirror", hard, createRandom(1)) as SceneElement;
    const [before, after] = [measureElement(deer), measureElement(mirrored)];
    expect((before.left + before.right) / 2).toBeCloseTo(
      300 + (300 - (after.left + after.right) / 2),
      5,
    );
    expect(after.bottom).toBeCloseTo(before.bottom, 5);
    expect(after.right - after.left).toBeCloseTo(before.right - before.left, 5);
  });

  it("adds an element by taking it out of the other picture", () => {
    const withAdd = scenesWithAdd();
    expect(withAdd.length).toBeGreaterThan(0);
    withAdd.forEach(({ scene, plan }) => {
      plan.differences
        .filter((difference) => difference.kind === "add")
        .forEach((difference) => {
          expect(scene.elements.some((candidate) => candidate.id === difference.id)).toBe(true);
          expect(plan.original.elements.some((candidate) => candidate.id === difference.id)).toBe(
            false,
          );
          expect(plan.altered.elements.some((candidate) => candidate.id === difference.id)).toBe(
            true,
          );
        });
    });
  });

  it("leaves the other pictures of a puzzle whole when nothing is added", () => {
    const scene = generateScene(3);
    const plan = planWithRetries(scene, "easy");
    const added = (plan?.differences ?? []).filter((difference) => difference.kind === "add");
    expect(plan?.original.elements).toHaveLength(scene.elements.length - added.length);
  });

  it("marks an added or mirrored element with a region that covers it", () => {
    scenesWithAdd().forEach(({ scene, plan }) => {
      plan.differences
        .filter((difference) => difference.kind === "add" || difference.kind === "mirror")
        .forEach((difference) => {
          const target = scene.elements.find((candidate) => candidate.id === difference.id);
          const bounds = target ? measureElement(target) : difference.region;
          expect(difference.region.left).toBeLessThanOrEqual(bounds.left);
          expect(difference.region.right).toBeGreaterThanOrEqual(bounds.right);
        });
    });
  });

  it("has the same kinds to add as to remove, and only asymmetric kinds to mirror", () => {
    expect(ELIGIBLE_KINDS.add).toEqual(ELIGIBLE_KINDS.remove);
    ["campfire", "sun", "mountain", "pine", "flower"].forEach((kind) => {
      expect(ELIGIBLE_KINDS.mirror).not.toContain(kind);
    });
  });
});

function scenesWithAdd() {
  return Array.from({ length: 40 }, (_, seed) => generateScene(seed))
    .map((scene) => ({ scene, plan: planWithRetries(scene, "medium") }))
    .filter(
      (entry): entry is { scene: Scene; plan: DifferencePlan } =>
        entry.plan !== null &&
        entry.plan.differences.some((difference) => difference.kind === "add"),
    );
}
