import { describe, expect, it } from "vitest";
import { CONFLICT, OBVIOUS, SUNNY } from "./fixtures";
import { analysePuzzle, listPlans, readMaxPoints, scorePlan } from "./solver";
import { UNPLACED } from "./types";

describe("listPlans", () => {
  it("lists every way to give each trip its own day", () => {
    expect(listPlans(5, 2)).toHaveLength(20);
    expect(listPlans(7, 3)).toHaveLength(210);
    expect(listPlans(7, 4)).toHaveLength(840);
  });

  it("never uses a day twice in one plan", () => {
    listPlans(5, 3).forEach((plan) => expect(new Set(plan).size).toBe(3));
  });

  it("lists plans in a stable order, each one once", () => {
    const plans = listPlans(4, 2);
    expect(plans[0]).toEqual([0, 1]);
    expect(new Set(plans.map((plan) => plan.join())).size).toBe(plans.length);
  });
});

describe("scorePlan", () => {
  it("adds up the points of every trip on its day", () => {
    expect(scorePlan(OBVIOUS, [0, 1])).toBe(6);
    expect(scorePlan(OBVIOUS, [2, 1])).toBe(5);
    expect(scorePlan(OBVIOUS, [1, 0])).toBe(1);
  });

  it("gives nothing for a trip that is not planned", () => {
    expect(scorePlan(OBVIOUS, [UNPLACED, 1])).toBe(3);
    expect(scorePlan(OBVIOUS, [UNPLACED, UNPLACED])).toBe(0);
  });
});

describe("readMaxPoints", () => {
  it("is the top score of every trip added up", () => {
    expect(readMaxPoints(OBVIOUS)).toBe(6);
  });
});

describe("analysePuzzle", () => {
  it("finds the best plan and how far the next different one is behind", () => {
    const analysis = analysePuzzle(OBVIOUS);
    expect(analysis.best).toBe(6);
    expect(analysis.rival).toBe(5);
    expect(analysis.bestPlan).toEqual([0, 1]);
  });

  it("measures how well a trip-by-trip choice does", () => {
    expect(analysePuzzle(OBVIOUS).greedy).toBe(6);
    expect(analysePuzzle(CONFLICT).greedy).toBe(4);
    expect(analysePuzzle(CONFLICT).best).toBe(5);
  });

  it("gives the best plan to the trip that needs the shared day most", () => {
    const { bestPlan } = analysePuzzle(CONFLICT);
    expect(bestPlan[1]).toBe(SUNNY);
  });

  it("measures how much a plan chosen blindly would score", () => {
    const { averageShare } = analysePuzzle(OBVIOUS);
    const plans = listPlans(3, 2);
    const mean = plans.reduce((sum, plan) => sum + scorePlan(OBVIOUS, plan), 0) / plans.length;
    expect(averageShare).toBeCloseTo(mean / 6, 10);
    expect(averageShare).toBeGreaterThan(0);
    expect(averageShare).toBeLessThan(1);
  });

  it("treats days with the same weather as the same plan", () => {
    const twin = { weather: [0, 0, 4], trips: [0, 4] };
    expect(analysePuzzle(twin).best).toBe(6);
    expect(analysePuzzle(twin).rival).toBeLessThan(6);
  });

  it("reports no rival when every plan gives the same weather", () => {
    expect(analysePuzzle({ weather: [0, 0, 0], trips: [0, 1] }).rival).toBe(-1);
  });

  it("gives the same answer again", () => {
    expect(analysePuzzle(OBVIOUS)).toBe(analysePuzzle(OBVIOUS));
  });
});
