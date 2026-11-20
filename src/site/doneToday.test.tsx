import { describe, expect, it } from "vitest";
import { markDoneToday } from "../core/doneToday";
import { showDoneMarks } from "./doneToday";

function renderMarks(): HTMLElement {
  const root = document.createElement("div");
  root.innerHTML = '<span data-done-game="a" hidden></span><span data-done-game="b" hidden></span>';
  return root;
}

describe("showDoneMarks", () => {
  it("shows the mark of a game finished today and keeps the others hidden", () => {
    markDoneToday("a");
    const root = renderMarks();
    showDoneMarks(root);
    const [first, second] = Array.from(root.querySelectorAll<HTMLElement>("[data-done-game]"));
    expect(first.hidden).toBe(false);
    expect(second.hidden).toBe(true);
  });

  it("hides a mark again when the game is not finished", () => {
    const root = renderMarks();
    root.querySelectorAll<HTMLElement>("[data-done-game]").forEach((mark) => {
      mark.hidden = false;
    });
    showDoneMarks(root);
    root.querySelectorAll<HTMLElement>("[data-done-game]").forEach((mark) => {
      expect(mark.hidden).toBe(true);
    });
  });
});
