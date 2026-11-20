import { describe, expect, it } from "vitest";
import { frameShareText } from "./shareFrame";

const frame = { streakLine: "🔥 5-day streak", callLine: "Can you beat it?" };

describe("frameShareText", () => {
  it("adds the streak and the invitation before the link", () => {
    expect(frameShareText("Dailyverse Game #1 3/5\n🟩\nhttps://example.com/game", frame)).toBe(
      "Dailyverse Game #1 3/5\n🟩\n🔥 5-day streak\nCan you beat it?\nhttps://example.com/game",
    );
  });

  it("leaves out the streak line when there is none", () => {
    expect(
      frameShareText("Dailyverse Game #1 3/5\nhttps://example.com", { ...frame, streakLine: null }),
    ).toBe("Dailyverse Game #1 3/5\nCan you beat it?\nhttps://example.com");
  });

  it("works for a text without a link", () => {
    expect(frameShareText("Dailyverse Game #1 3/5", frame)).toBe(
      "Dailyverse Game #1 3/5\n🔥 5-day streak\nCan you beat it?",
    );
  });
});
