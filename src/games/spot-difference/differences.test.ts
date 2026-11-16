import { describe, expect, it } from "vitest";
import { createRandom } from "../../core/random";
import { DIFFICULTIES } from "../../core/difficulty";
import { alterElement, ELIGIBLE_KINDS, planDifferences } from "./differences";
import { TIER_PROFILES } from "./difficulty";
import { drawElement, TENT_COLOURS, VARIANT_COUNTS } from "./elements";
import { boundsOverlap, measureElement } from "./geometry";
import { CROWD_BY_LAYER, SCENE_HEIGHT, SCENE_WIDTH } from "./recipes";
import { generateScene } from "./scene";
import {
  DIFFERENCE_KINDS,
  type DifferenceKind,
  type ElementKind,
  type SceneElement,
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
