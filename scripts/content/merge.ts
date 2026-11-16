import { MAX_GUESSES } from "../../src/core/guessing";
import type { MysteryPlacePuzzle } from "../../src/games/mystery-place/types";
import type { DraftPuzzle } from "./types";

const ID_PATTERN = /^mp-(\d+)$/;

function findHighestIdNumber(puzzles: readonly MysteryPlacePuzzle[]): number {
  return puzzles.reduce((highest, puzzle) => {
    const match = ID_PATTERN.exec(puzzle.id);
    return match ? Math.max(highest, Number(match[1])) : highest;
  }, 0);
}

export function convertDraftsToPuzzles(
  drafts: readonly DraftPuzzle[],
  existing: readonly MysteryPlacePuzzle[],
): MysteryPlacePuzzle[] {
  const firstNumber = findHighestIdNumber(existing) + 1;
  return drafts.map((draft, index) => {
    if (draft.clues.length !== MAX_GUESSES) {
      throw new Error(`Draft ${draft.country} must have exactly ${MAX_GUESSES} clues`);
    }
    const clues = draft.clues.map(({ kind, text }) => ({ kind, text }));
    return {
      id: `mp-${String(firstNumber + index).padStart(4, "0")}`,
      country: draft.country,
      difficulty: draft.difficulty,
      clues: clues as MysteryPlacePuzzle["clues"],
      reveal: { funFact: draft.reveal.funFact, sourceUrl: draft.reveal.sourceUrl },
    };
  });
}
