import { describe, expect, it } from "vitest";
import { createInitialState, type SpotState } from "./game";
import { buildShareText } from "./share";

function stateWith(found: number, mistakes: number, status: SpotState["status"]): SpotState {
  return {
    ...createInitialState("1003:hard"),
    found: ["a", "b", "c", "d", "e"].slice(0, found),
    mistakes,
    status,
  };
}

describe("buildShareText", () => {
  it("shows the day, the five differences found and all lives for a perfect round", () => {
    expect(buildShareText(stateWith(5, 0, "won"), 4)).toBe(
      "Dailyverse Spot the Difference #4 5/5\n❤️❤️❤️",
    );
  });

  it("shows lost lives as empty hearts", () => {
    expect(buildShareText(stateWith(5, 2, "won"), 4).split("\n")[1]).toBe("❤️🤍🤍");
  });

  it("shows how many were found in a lost round, with no lives left", () => {
    expect(buildShareText(stateWith(3, 3, "lost"), 12)).toBe(
      "Dailyverse Spot the Difference #12 3/5\n🤍🤍🤍",
    );
  });

  it("appends the page address when given one", () => {
    const lines = buildShareText(
      stateWith(5, 0, "won"),
      1,
      "https://example.com/spot-the-difference",
    ).split("\n");
    expect(lines).toHaveLength(3);
    expect(lines[2]).toBe("https://example.com/spot-the-difference");
  });

  it("does not say which differences were found or where", () => {
    const text = buildShareText({ ...stateWith(2, 1, "playing"), found: ["pine-3", "tent-1"] }, 2);
    expect(text).not.toContain("pine");
    expect(text).not.toContain("tent");
  });
});
