import { DIFFICULTIES, type Difficulty } from "../../core/difficulty";

export const CLUE_KINDS = [
  "geography",
  "climate",
  "wildlife",
  "outdoor",
  "culture",
  "food",
  "history",
  "landmark",
  "language",
  "sport",
  "film",
] as const;

export type ClueKind = (typeof CLUE_KINDS)[number];

export { DIFFICULTIES, type Difficulty };

export interface Clue {
  kind: ClueKind;
  text: string;
}

export interface Reveal {
  funFact: string;
  sourceUrl: string;
}

export interface MysteryPlacePuzzle {
  id: string;
  country: string;
  difficulty: Difficulty;
  clues: [Clue, Clue, Clue, Clue, Clue];
  reveal: Reveal;
}
