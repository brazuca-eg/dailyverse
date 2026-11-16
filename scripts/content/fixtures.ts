import { countries } from "../../src/core/countries";
import type { CheckContext, DraftPuzzle } from "./types";

export const SLOVENIA_TEXT =
  "Slovenia is a country in Central Europe. It borders Italy to its west, Austria to its north, " +
  "Hungary to its northeast, and Croatia to its south and southeast; its southwestern boundary " +
  "consists of a 46.6-kilometre coastline on the Adriatic Sea. As of 2020, 60.4% of Slovenia " +
  "is forested, ranking it second in Europe by percentage of area forested.";

export function createContext(overrides: Partial<CheckContext> = {}): CheckContext {
  return {
    countries,
    existingCountryCodes: new Set<string>(),
    sources: new Map([["Slovenia", SLOVENIA_TEXT]]),
    ...overrides,
  };
}

export function createValidReply(): {
  clues: { kind: string; text: string; quote: string }[];
  funFact: { text: string; quote: string };
} {
  const draft = createValidDraft();
  return {
    clues: draft.clues.map((clue) => ({
      kind: clue.kind,
      text: clue.text,
      quote: clue.evidence.quote,
    })),
    funFact: { text: draft.reveal.funFact, quote: draft.reveal.evidence.quote },
  };
}

export function createValidDraft(): DraftPuzzle {
  const page = "Slovenia";
  return {
    country: "SI",
    difficulty: "hard",
    clues: [
      {
        kind: "geography",
        text: "Its Adriatic Sea coastline is only about 46.6 kilometres long.",
        evidence: {
          page,
          quote:
            "its southwestern boundary consists of a 46.6-kilometre coastline on the Adriatic Sea",
        },
      },
      {
        kind: "geography",
        text: "It borders Italy, Austria, Hungary and Croatia.",
        evidence: {
          page,
          quote:
            "It borders Italy to its west, Austria to its north, Hungary to its northeast, and Croatia",
        },
      },
      {
        kind: "geography",
        text: "This small country lies in Central Europe.",
        evidence: { page, quote: "Slovenia is a country in Central Europe" },
      },
      {
        kind: "outdoor",
        text: "It ranks second in Europe for forested area.",
        evidence: { page, quote: "ranking it second in Europe by percentage of area forested" },
      },
      {
        kind: "outdoor",
        text: "60.4% of its land is covered by forest.",
        evidence: { page, quote: "60.4% of Slovenia is forested" },
      },
    ],
    reveal: {
      funFact: "It is the second most forested country in Europe.",
      sourceUrl: "https://en.wikipedia.org/wiki/Slovenia",
      evidence: { page, quote: "ranking it second in Europe by percentage of area forested" },
    },
  };
}
