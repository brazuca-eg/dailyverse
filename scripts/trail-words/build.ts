import {
  findPangramSets,
  indexWords,
  listLetters,
  listWordsForLetters,
  measurePuzzle,
} from "../../src/games/trail-words/analysis";
import { encodePuzzle } from "../../src/games/trail-words/encode";
import { expandBlocklist, parseScowl, selectAnswerable } from "../../src/games/trail-words/filter";
import { selectPool, type Candidate } from "../../src/games/trail-words/pool";
import {
  fitsTier,
  TIER_RULES,
  TRAIL_TIERS,
  type TrailTier,
} from "../../src/games/trail-words/tiers";
import { formatWordList } from "../../src/games/trail-words/words";

const PER_SET_LIMIT = 2;

export const NOTICE_LINES: readonly string[] = [
  "Trail Words word list.",
  "Built from SCOWL (the English Speller Database), https://wordlist.aspell.net",
  "Copyright 2000-2026 by Kevin Atkinson",
  "",
  "Permission to use, copy, modify, distribute, and sell any part of the English",
  "Speller Database (ESDB, previously known as SCOWLv2), or word lists",
  "created from it, is hereby granted without fee, provided that the above",
  "copyright notice appears in all copies and that both the above copyright",
  "notice and this notice appear in supporting documentation. Kevin Atkinson",
  "makes no representations about the suitability of this database for any",
  'purpose. It is provided "as is" without express or implied warranty.',
  "",
  "ESDB is derived from many sources, most of which are in the Public Domain.",
  "Data from the Corpus of Contemporary American English (COCA) was also used.",
  "",
  "Only words that are also in ENABLE (public domain) are kept, which leaves out abbreviations.",
  "Filtered with the List of Dirty, Naughty, Obscene, and Otherwise Bad Words,",
  "https://github.com/LDNOOBW/List-of-Dirty-Naughty-Obscene-and-Otherwise-Bad-Words,",
  "licensed under CC BY 4.0, with additions. Words marked * are common words.",
];

export interface BuildInputs {
  enableText: string;
  commonText: string;
  acceptedText: string;
  blocklistText: string;
}

export interface TrailData {
  wordFile: string;
  puzzles: Record<TrailTier, string[]>;
  wordCount: number;
  commonCount: number;
  candidateCounts: Record<TrailTier, number>;
}

export function buildTrailData(inputs: BuildInputs): TrailData {
  const blocked = expandBlocklist(inputs.blocklistText.split("\n"));
  const enable = new Set(inputs.enableText.split("\n").map((word) => word.trim()));
  const keep = (text: string) =>
    selectAnswerable(parseScowl(text), blocked).filter((word) => enable.has(word));
  const accepted = keep(inputs.acceptedText);
  const acceptedSet = new Set(accepted);
  const common = new Set(keep(inputs.commonText).filter((word) => acceptedSet.has(word)));
  const index = indexWords(accepted);
  const candidates: Record<TrailTier, Candidate[]> = { medium: [], hard: [] };
  findPangramSets(index, common).forEach((letterMask) => {
    const words = listWordsForLetters(index, letterMask);
    listLetters(letterMask).forEach((centreBit) => {
      const metrics = measurePuzzle(words, letterMask, centreBit, common);
      TRAIL_TIERS.filter((tier) => fitsTier(metrics, tier)).forEach((tier) => {
        candidates[tier].push({ letterMask, centreBit });
      });
    });
  });
  return {
    wordFile: formatWordList(accepted, common, NOTICE_LINES),
    puzzles: {
      medium: selectPool(candidates.medium, TIER_RULES.medium.poolSize, PER_SET_LIMIT).map((pick) =>
        encodePuzzle(pick.letterMask, pick.centreBit),
      ),
      hard: selectPool(candidates.hard, TIER_RULES.hard.poolSize, PER_SET_LIMIT).map((pick) =>
        encodePuzzle(pick.letterMask, pick.centreBit),
      ),
    },
    wordCount: accepted.length,
    commonCount: common.size,
    candidateCounts: { medium: candidates.medium.length, hard: candidates.hard.length },
  };
}
