import { describe, expect, it } from "vitest";
import { countries } from "../../core/countries";
import { containsWholeWord } from "../../core/text";
import { puzzles } from "./data";
import { MAX_GUESSES } from "../../core/guessing";

const countriesByCode = new Map(countries.map((country) => [country.code, country]));

describe("mystery place puzzles", () => {
  it("has unique ids", () => {
    expect(new Set(puzzles.map((puzzle) => puzzle.id)).size).toBe(puzzles.length);
  });

  it("uses each country at most once", () => {
    const answers = puzzles.map((puzzle) => puzzle.country);
    expect(new Set(answers).size).toBe(answers.length);
  });

  it.each(puzzles.map((puzzle) => [puzzle.id, puzzle] as const))(
    "%s follows the authoring rules",
    (_id, puzzle) => {
      const answer = countriesByCode.get(puzzle.country);
      expect(answer, `unknown country ${puzzle.country}`).toBeDefined();
      expect(puzzle.clues).toHaveLength(MAX_GUESSES);
      const forbidden = [answer!.name, ...answer!.aliases, ...(answer!.demonyms ?? [])];
      for (const clue of puzzle.clues) {
        for (const word of forbidden) {
          expect(containsWholeWord(clue.text, word), `clue leaks "${word}"`).toBe(false);
        }
      }
      expect(puzzle.reveal.sourceUrl).toMatch(/^https?:\/\//);
      expect(puzzle.reveal.funFact.length).toBeGreaterThan(0);
    },
  );
});
