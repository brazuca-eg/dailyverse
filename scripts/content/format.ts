import type { MysteryPlacePuzzle } from "../../src/games/mystery-place/types";

function dump(value: unknown): string {
  return JSON.stringify(value);
}

function formatPuzzle(puzzle: MysteryPlacePuzzle): string {
  const clues = puzzle.clues
    .map((clue) => `      { "kind": ${dump(clue.kind)}, "text": ${dump(clue.text)} }`)
    .join(",\n");
  return [
    "  {",
    `    "id": ${dump(puzzle.id)},`,
    `    "country": ${dump(puzzle.country)},`,
    `    "difficulty": ${dump(puzzle.difficulty)},`,
    '    "clues": [',
    clues,
    "    ],",
    '    "reveal": {',
    `      "funFact": ${dump(puzzle.reveal.funFact)},`,
    `      "sourceUrl": ${dump(puzzle.reveal.sourceUrl)}`,
    "    }",
    "  }",
  ].join("\n");
}

export function formatPuzzles(puzzles: readonly MysteryPlacePuzzle[]): string {
  return `[\n${puzzles.map(formatPuzzle).join(",\n")}\n]\n`;
}
