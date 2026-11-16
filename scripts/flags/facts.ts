import { extractNumbers, normalizeForMatch } from "../content/checks";
import { toWikipediaUrl } from "../content/wikipedia";

export interface FlagFactDraft {
  code: string;
  funFact: string;
  evidence: { page: string; quote: string };
}

export interface FlagFact {
  funFact: string;
  sourceUrl: string;
}

const MIN_FACT_LENGTH = 30;
const MAX_FACT_LENGTH = 220;
const MIN_QUOTE_LENGTH = 25;

export function listFactPages(drafts: readonly FlagFactDraft[]): string[] {
  return [...new Set(drafts.map((draft) => draft.evidence.page))];
}

function collectDraftIssues(draft: FlagFactDraft, sources: ReadonlyMap<string, string>): string[] {
  const where = draft.code;
  const issues: string[] = [];
  const quote = normalizeForMatch(draft.evidence.quote);
  const source = sources.get(draft.evidence.page);
  if (draft.funFact.length < MIN_FACT_LENGTH || draft.funFact.length > MAX_FACT_LENGTH) {
    issues.push(`${where}: the fact must be ${MIN_FACT_LENGTH} to ${MAX_FACT_LENGTH} characters`);
  }
  if (quote.length < MIN_QUOTE_LENGTH) {
    issues.push(`${where}: the quote is shorter than ${MIN_QUOTE_LENGTH} characters`);
  }
  if (source === undefined) {
    issues.push(`${where}: the page "${draft.evidence.page}" was not fetched`);
  } else if (!normalizeForMatch(source).includes(quote)) {
    issues.push(`${where}: the quote was not found in "${draft.evidence.page}"`);
  }
  const quoteNumbers = new Set(extractNumbers(quote));
  extractNumbers(draft.funFact)
    .filter((number) => !quoteNumbers.has(number))
    .forEach((number) =>
      issues.push(`${where}: the number ${number} does not appear in the quote`),
    );
  return issues;
}

export function collectFactIssues(
  drafts: readonly FlagFactDraft[],
  expectedCodes: readonly string[],
  sources: ReadonlyMap<string, string>,
): string[] {
  const codes = drafts.map((draft) => draft.code);
  const missing = expectedCodes.filter((code) => !codes.includes(code));
  const unknown = codes.filter((code) => !expectedCodes.includes(code));
  const duplicated = codes.filter((code, index) => codes.indexOf(code) !== index);
  return [
    ...missing.map((code) => `${code}: there is no fact for this country`),
    ...unknown.map((code) => `${code}: this is not a known country`),
    ...duplicated.map((code) => `${code}: there is more than one fact`),
    ...drafts.flatMap((draft) => collectDraftIssues(draft, sources)),
  ];
}

export function deriveFlagFacts(drafts: readonly FlagFactDraft[]): Record<string, FlagFact> {
  return Object.fromEntries(
    drafts.map((draft) => [
      draft.code,
      { funFact: draft.funFact, sourceUrl: toWikipediaUrl(draft.evidence.page) },
    ]),
  );
}
