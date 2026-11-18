import { describe, expect, it } from "vitest";
import {
  buildPuzzleId,
  createInitialState,
  finishPreview,
  placeTrip,
  startPreview,
  submitPlan,
} from "./game";
import { mediumRound } from "./fixtures";
import { buildShareText } from "./share";
import { analysePuzzle } from "./solver";

const { puzzle } = mediumRound;
const { best, bestPlan } = analysePuzzle(puzzle);

function finish(plan: number[], peeksUsed = 0) {
  const ready = finishPreview(startPreview(createInitialState(buildPuzzleId(mediumRound), puzzle)));
  const placed = plan.reduce((state, day, trip) => placeTrip(state, trip, day), ready);
  return submitPlan({ ...placed, peeksUsed }, puzzle);
}

describe("buildShareText", () => {
  it("shows the day, the number of days, the stars, the points and the peeks", () => {
    expect(buildShareText(finish(bestPlan, 1), puzzle, 7).split("\n")).toEqual([
      `Dailyverse Weather Window #7 · 7 days · ★★★★☆ · ${best}/${best} pts`,
      "👀 1 peek",
    ]);
  });

  it("uses plurals correctly", () => {
    expect(buildShareText(finish(bestPlan, 2), puzzle, 1)).toContain("👀 2 peeks");
    expect(buildShareText(finish(bestPlan, 0), puzzle, 1)).toContain("👀 0 peeks");
  });

  it("shows empty stars for a loss and the points that were scored", () => {
    const days = puzzle.weather.map((_, day) => day);
    const worst = days
      .flatMap((a) => days.flatMap((b) => days.map((c) => [a, b, c])))
      .filter((plan) => new Set(plan).size === 3)
      .find((plan) => finish(plan).status === "lost") as number[];
    const first = buildShareText(finish(worst), puzzle, 2).split("\n")[0];
    expect(first).toContain("☆☆☆☆☆");
    expect(first).not.toContain("★");
    expect(first).toMatch(new RegExp(`· \\d+/${best} pts$`));
  });

  it("does not give away the forecast", () => {
    const text = buildShareText(finish(bestPlan), puzzle, 2);
    expect(text).not.toMatch(/sunny|cloudy|rainy|windy|snowy/i);
  });

  it("adds the link on its own last line", () => {
    const lines = buildShareText(finish(bestPlan), puzzle, 3, "https://dailyverse.example/w").split(
      "\n",
    );
    expect(lines[lines.length - 1]).toBe("https://dailyverse.example/w");
    expect(lines).toHaveLength(3);
  });
});
