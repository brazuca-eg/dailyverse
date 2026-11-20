import { describe, expect, it } from "vitest";
import { puzzles } from "./data";
import { localisePuzzles } from "./translations";

const [first, second] = puzzles;
const translated = {
  [first.id]: {
    clues: ["Uno", "Dos", "Tres", "Cuatro", "Cinco"],
    funFact: "Un dato curioso.",
  },
};

describe("localisePuzzles", () => {
  it("gives the English puzzles when there are no translations", () => {
    expect(localisePuzzles(puzzles, "en")).toEqual(puzzles);
  });

  it("replaces the clue texts and the fun fact of a translated puzzle", () => {
    const [local] = localisePuzzles(puzzles, "es", translated);
    expect(local.clues.map((clue) => clue.text)).toEqual(["Uno", "Dos", "Tres", "Cuatro", "Cinco"]);
    expect(local.reveal.funFact).toBe("Un dato curioso.");
  });

  it("keeps everything else of the puzzle", () => {
    const [local] = localisePuzzles(puzzles, "es", translated);
    expect(local.id).toBe(first.id);
    expect(local.country).toBe(first.country);
    expect(local.clues.map((clue) => clue.kind)).toEqual(first.clues.map((clue) => clue.kind));
    expect(local.reveal.sourceUrl).toBe(first.reveal.sourceUrl);
  });

  it("keeps a puzzle that was not translated as it is", () => {
    const local = localisePuzzles(puzzles, "es", translated);
    expect(local[1]).toBe(second);
    expect(local).toHaveLength(puzzles.length);
  });

  it("keeps the English text of a clue that has no translation", () => {
    const [local] = localisePuzzles(puzzles, "es", { [first.id]: { clues: ["Uno"], funFact: "" } });
    expect(local.clues[0].text).toBe("Uno");
    expect(local.clues[1].text).toBe(first.clues[1].text);
    expect(local.reveal.funFact).toBe(first.reveal.funFact);
  });

  it("does not change the order or the number of puzzles", () => {
    expect(localisePuzzles(puzzles, "de", translated).map((puzzle) => puzzle.id)).toEqual(
      puzzles.map((puzzle) => puzzle.id),
    );
  });
});
