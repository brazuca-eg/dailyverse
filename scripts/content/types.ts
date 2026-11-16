import type { Country } from "../../src/core/types";
import type { ClueKind, Difficulty } from "../../src/games/mystery-place/types";

export interface Evidence {
  page: string;
  quote: string;
}

export interface DraftClue {
  kind: ClueKind;
  text: string;
  evidence: Evidence;
}

export interface DraftReveal {
  funFact: string;
  sourceUrl: string;
  evidence: Evidence;
}

export interface DraftPuzzle {
  country: string;
  difficulty: Difficulty;
  clues: DraftClue[];
  reveal: DraftReveal;
}

export type IssueSeverity = "error" | "warning";

export interface Issue {
  severity: IssueSeverity;
  puzzle: string;
  message: string;
}

export type SourceTexts = ReadonlyMap<string, string>;

export interface CheckContext {
  countries: readonly Country[];
  existingCountryCodes: ReadonlySet<string>;
  sources: SourceTexts;
}
