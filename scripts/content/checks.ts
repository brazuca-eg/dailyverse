import { containsWholeWord } from "../../src/core/text";
import type { Country } from "../../src/core/types";
import { MAX_GUESSES } from "../../src/games/mystery-place/game";
import { CLUE_KINDS, DIFFICULTIES } from "../../src/games/mystery-place/types";
import type { CheckContext, DraftPuzzle, Evidence, Issue, IssueSeverity } from "./types";
import { toWikipediaUrl } from "./wikipedia";

const MIN_QUOTE_LENGTH = 25;
const MIN_CLUE_LENGTH = 20;
const MAX_CLUE_LENGTH = 170;
const MAX_FUN_FACT_LENGTH = 220;

export function normalizeForMatch(text: string): string {
  return text
    .normalize("NFKC")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export function extractNumbers(text: string): string[] {
  const matches = text.match(/\d[\d,]*(?:\.\d+)?/g) ?? [];
  return matches.map((match) => match.replace(/,/g, "").replace(/\.$/, ""));
}

export function hasErrors(issues: readonly Issue[]): boolean {
  return issues.some((issue) => issue.severity === "error");
}

class IssueCollector {
  readonly issues: Issue[] = [];

  constructor(private readonly puzzle: string) {}

  add(severity: IssueSeverity, message: string): void {
    this.issues.push({ severity, puzzle: this.puzzle, message });
  }
}

function listForbiddenWords(country: Country): string[] {
  return [country.name, ...country.aliases, ...(country.demonyms ?? [])];
}

function checkEvidence(
  collector: IssueCollector,
  where: string,
  evidence: Evidence,
  context: CheckContext,
): string {
  const sourceText = context.sources.get(evidence.page);
  if (sourceText === undefined) {
    collector.add("error", `${where}: source page "${evidence.page}" was not fetched`);
    return "";
  }
  const quote = normalizeForMatch(evidence.quote);
  if (quote.length < MIN_QUOTE_LENGTH) {
    collector.add("error", `${where}: the quote is shorter than ${MIN_QUOTE_LENGTH} characters`);
  }
  if (!normalizeForMatch(sourceText).includes(quote)) {
    collector.add("error", `${where}: the quote was not found in "${evidence.page}"`);
  }
  return quote;
}

function checkNumbers(
  collector: IssueCollector,
  where: string,
  text: string,
  normalizedQuote: string,
): void {
  const quoteNumbers = new Set(extractNumbers(normalizedQuote));
  for (const number of extractNumbers(text)) {
    if (!quoteNumbers.has(number)) {
      collector.add("error", `${where}: the number ${number} does not appear in the quote`);
    }
  }
}

function checkClues(
  collector: IssueCollector,
  draft: DraftPuzzle,
  country: Country | undefined,
  context: CheckContext,
): void {
  if (draft.clues.length !== MAX_GUESSES) {
    collector.add("error", `needs exactly ${MAX_GUESSES} clues, found ${draft.clues.length}`);
  }
  draft.clues.forEach((clue, index) => {
    const where = `clue ${index + 1}`;
    if (!(CLUE_KINDS as readonly string[]).includes(clue.kind)) {
      collector.add("error", `${where}: unknown kind "${clue.kind}"`);
    }
    if (clue.text.length < MIN_CLUE_LENGTH || clue.text.length > MAX_CLUE_LENGTH) {
      collector.add(
        "warning",
        `${where}: ${clue.text.length} characters, aim for ${MIN_CLUE_LENGTH} to ${MAX_CLUE_LENGTH}`,
      );
    }
    if (country) {
      for (const word of listForbiddenWords(country)) {
        if (containsWholeWord(clue.text, word)) {
          collector.add("error", `${where}: gives away the answer with "${word}"`);
        }
      }
    }
    const quote = checkEvidence(collector, where, clue.evidence, context);
    checkNumbers(collector, where, clue.text, quote);
  });
}

function checkReveal(collector: IssueCollector, draft: DraftPuzzle, context: CheckContext): void {
  const { reveal } = draft;
  if (reveal.funFact.length > MAX_FUN_FACT_LENGTH) {
    collector.add(
      "warning",
      `fun fact is ${reveal.funFact.length} characters, aim for under ${MAX_FUN_FACT_LENGTH}`,
    );
  }
  const quote = checkEvidence(collector, "fun fact", reveal.evidence, context);
  checkNumbers(collector, "fun fact", reveal.funFact, quote);
  const expectedUrl = toWikipediaUrl(reveal.evidence.page);
  if (reveal.sourceUrl !== expectedUrl) {
    collector.add("error", `source URL should be ${expectedUrl}`);
  }
}

export function collectDraftIssues(draft: DraftPuzzle, context: CheckContext): Issue[] {
  const collector = new IssueCollector(draft.country);
  const country = context.countries.find((candidate) => candidate.code === draft.country);
  if (!country) {
    collector.add("error", `unknown country code "${draft.country}"`);
  } else if (context.existingCountryCodes.has(draft.country)) {
    collector.add("error", `${country.name} already has a published puzzle`);
  }
  if (!(DIFFICULTIES as readonly string[]).includes(draft.difficulty)) {
    collector.add("error", `unknown difficulty "${draft.difficulty}"`);
  }
  checkClues(collector, draft, country, context);
  checkReveal(collector, draft, context);
  return collector.issues;
}

export function collectBatchIssues(drafts: readonly DraftPuzzle[], context: CheckContext): Issue[] {
  const issues = drafts.flatMap((draft) => collectDraftIssues(draft, context));
  const seen = new Set<string>();
  for (const draft of drafts) {
    if (seen.has(draft.country)) {
      issues.push({
        severity: "error",
        puzzle: draft.country,
        message: "appears more than once in this batch",
      });
    }
    seen.add(draft.country);
  }
  const clueTexts = new Map<string, string>();
  for (const draft of drafts) {
    for (const clue of draft.clues) {
      const key = normalizeForMatch(clue.text);
      const owner = clueTexts.get(key);
      if (owner !== undefined && owner !== draft.country) {
        issues.push({
          severity: "warning",
          puzzle: draft.country,
          message: `shares an identical clue with ${owner}`,
        });
      }
      clueTexts.set(key, draft.country);
    }
  }
  return issues;
}
