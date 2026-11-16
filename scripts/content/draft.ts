import type { Country } from "../../src/core/types";
import { collectDraftIssues } from "./checks";
import type { TextGenerator } from "./llm";
import type { PlannedPuzzle } from "./plan";
import { buildSystemPrompt, buildUserPrompt, selectArticleExcerpt } from "./prompt";
import { buildDraftFromReply, parseModelReply } from "./reply";
import { getWikipediaTitle } from "./titles";
import type { DraftPuzzle, Issue } from "./types";

const DEFAULT_MAX_ATTEMPTS = 3;
const MAX_CONSECUTIVE_API_FAILURES = 2;

export interface DraftDependencies {
  generator: TextGenerator;
  fetchArticle: (title: string) => Promise<string>;
  countries: readonly Country[];
  existingCountryCodes: ReadonlySet<string>;
  maxAttempts?: number;
  log?: (message: string) => void;
}

export interface DraftOutcome {
  country: Country;
  draft?: DraftPuzzle;
  warnings: Issue[];
  failures: string[];
  apiFailed: boolean;
}

export interface BatchResult {
  drafts: DraftPuzzle[];
  warnings: Issue[];
  skipped: string[];
  stoppedEarly: boolean;
}

type ReplyEvaluation = { draft: DraftPuzzle; warnings: Issue[] } | { feedback: string[] };

function describeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function evaluateReply(
  replyText: string,
  planned: PlannedPuzzle,
  title: string,
  articleText: string,
  dependencies: DraftDependencies,
): ReplyEvaluation {
  const { country, difficulty } = planned;
  let draft: DraftPuzzle;
  try {
    draft = buildDraftFromReply(parseModelReply(replyText), country, difficulty, title);
  } catch (error) {
    return { feedback: [`Your reply could not be used: ${describeError(error)}`] };
  }
  const issues = collectDraftIssues(draft, {
    countries: dependencies.countries,
    existingCountryCodes: dependencies.existingCountryCodes,
    sources: new Map([[title, articleText]]),
  });
  const errors = issues.filter((issue) => issue.severity === "error");
  if (errors.length > 0) {
    return { feedback: errors.map((issue) => issue.message) };
  }
  return { draft, warnings: issues.filter((issue) => issue.severity === "warning") };
}

export async function generateDraft(
  planned: PlannedPuzzle,
  dependencies: DraftDependencies,
): Promise<DraftOutcome> {
  const { country, difficulty } = planned;
  const maxAttempts = dependencies.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;
  const log = dependencies.log ?? (() => {});
  const title = getWikipediaTitle(country);
  const failed = (failures: string[], apiFailed = false): DraftOutcome => ({
    country,
    warnings: [],
    failures,
    apiFailed,
  });

  let articleText: string;
  try {
    articleText = await dependencies.fetchArticle(title);
  } catch (error) {
    return failed([`could not fetch the article: ${describeError(error)}`]);
  }
  const excerpt = selectArticleExcerpt(articleText);
  let feedback: string[] = [];

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    log(`  attempt ${attempt} of ${maxAttempts}`);
    let replyText: string;
    try {
      replyText = await dependencies.generator.generate({
        system: buildSystemPrompt(),
        user: buildUserPrompt({ country, difficulty, articleTitle: title, excerpt, feedback }),
      });
    } catch (error) {
      return failed([`the model API failed: ${describeError(error)}`], true);
    }
    const evaluation = evaluateReply(replyText, planned, title, articleText, dependencies);
    if ("draft" in evaluation) {
      return {
        country,
        draft: evaluation.draft,
        warnings: evaluation.warnings,
        failures: [],
        apiFailed: false,
      };
    }
    feedback = evaluation.feedback;
  }
  return failed(
    feedback.map((message) => `still failing after ${maxAttempts} attempts: ${message}`),
  );
}

export async function generateBatch(
  planned: readonly PlannedPuzzle[],
  dependencies: DraftDependencies,
): Promise<BatchResult> {
  const log = dependencies.log ?? (() => {});
  const result: BatchResult = { drafts: [], warnings: [], skipped: [], stoppedEarly: false };
  let index = 0;
  let consecutiveApiFailures = 0;
  while (index < planned.length && consecutiveApiFailures < MAX_CONSECUTIVE_API_FAILURES) {
    const entry = planned[index];
    log(`\n${entry.country.name} (${entry.difficulty})`);
    const outcome = await generateDraft(entry, dependencies);
    if (outcome.draft) {
      result.drafts.push(outcome.draft);
      result.warnings.push(...outcome.warnings);
      consecutiveApiFailures = 0;
      log("  accepted");
    } else {
      const reason = outcome.failures.join("; ");
      result.skipped.push(`${entry.country.name}: ${reason}`);
      consecutiveApiFailures = outcome.apiFailed ? consecutiveApiFailures + 1 : 0;
      log(`  skipped: ${reason}`);
    }
    index += 1;
  }
  result.stoppedEarly = index < planned.length;
  return result;
}
