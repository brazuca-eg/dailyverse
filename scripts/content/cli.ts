import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { countries } from "../../src/core/countries";
import { calculateDaysSinceLaunch } from "../../src/core/daily";
import { PUZZLE_LAUNCH_DATE, puzzles } from "../../src/games/mystery-place/data";
import { readFlag } from "./args";
import { collectBatchIssues, hasErrors } from "./checks";
import { runDraft, runModels } from "./draft-command";
import { formatPuzzles } from "./format";
import { convertDraftsToPuzzles } from "./merge";
import { parseDrafts } from "./parse";
import { buildReviewSheet } from "./review";
import { calculateRunwayDays } from "./runway";
import type { DraftPuzzle, Issue } from "./types";
import { createArticleFetcher } from "./wikipedia";

const PUZZLES_PATH = join(process.cwd(), "src", "games", "mystery-place", "puzzles.json");
const DEFAULT_MINIMUM_RUNWAY = 14;

interface CheckResult {
  drafts: DraftPuzzle[];
  issues: Issue[];
}

function collectEvidencePages(drafts: readonly DraftPuzzle[]): string[] {
  const pages = drafts.flatMap((draft) => [
    ...draft.clues.map((clue) => clue.evidence.page),
    draft.reveal.evidence.page,
  ]);
  return [...new Set(pages)];
}

async function fetchSources(pages: readonly string[]): Promise<Map<string, string>> {
  const fetchArticle = createArticleFetcher();
  const sources = new Map<string, string>();
  for (const page of pages) {
    console.log(`Fetching "${page}"`);
    try {
      sources.set(page, await fetchArticle(page));
    } catch (error) {
      console.log(`  could not fetch: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  return sources;
}

function printIssues(issues: readonly Issue[]): void {
  if (issues.length === 0) {
    console.log("\nAll automatic checks passed.");
    return;
  }
  console.log("");
  for (const issue of issues) {
    console.log(`${issue.severity.toUpperCase().padEnd(7)} ${issue.puzzle}: ${issue.message}`);
  }
  const errorCount = issues.filter((issue) => issue.severity === "error").length;
  console.log(`\n${errorCount} error(s), ${issues.length - errorCount} warning(s).`);
}

async function checkDraftFile(draftPath: string): Promise<CheckResult> {
  const drafts = parseDrafts(JSON.parse(readFileSync(draftPath, "utf8")));
  const sources = await fetchSources(collectEvidencePages(drafts));
  const issues = collectBatchIssues(drafts, {
    countries,
    existingCountryCodes: new Set(puzzles.map((puzzle) => puzzle.country)),
    sources,
  });
  return { drafts, issues };
}

async function runCheck(args: readonly string[]): Promise<number> {
  const draftPath = args[0];
  if (!draftPath) {
    console.log("Usage: content:check <draft-file> [--review <output.md>]");
    return 2;
  }
  const { drafts, issues } = await checkDraftFile(draftPath);
  printIssues(issues);
  const reviewPath = readFlag(args, "--review");
  if (reviewPath) {
    writeFileSync(reviewPath, buildReviewSheet(drafts, countries, issues), "utf8");
    console.log(`Review sheet written to ${reviewPath}`);
  }
  return hasErrors(issues) ? 1 : 0;
}

async function runMerge(args: readonly string[]): Promise<number> {
  const draftPath = args[0];
  if (!draftPath) {
    console.log("Usage: content:merge <draft-file>");
    return 2;
  }
  const { drafts, issues } = await checkDraftFile(draftPath);
  printIssues(issues);
  if (hasErrors(issues)) {
    console.log("\nNothing was merged. Fix the errors first.");
    return 1;
  }
  const merged = [...puzzles, ...convertDraftsToPuzzles(drafts, puzzles)];
  writeFileSync(PUZZLES_PATH, formatPuzzles(merged), "utf8");
  console.log(
    `\nAdded ${drafts.length} puzzle(s). There are now ${merged.length} in puzzles.json.`,
  );
  console.log("Run the tests before committing.");
  return 0;
}

function runRunway(args: readonly string[]): number {
  const minimum = Number(readFlag(args, "--min") ?? DEFAULT_MINIMUM_RUNWAY);
  const daysSinceLaunch = calculateDaysSinceLaunch(new Date(), PUZZLE_LAUNCH_DATE);
  const runway = calculateRunwayDays(puzzles.length, daysSinceLaunch);
  console.log(`${puzzles.length} puzzles, ${runway} fresh day(s) left after today.`);
  if (runway < minimum) {
    console.log(`Below the minimum of ${minimum} days: time to add more puzzles.`);
    return 1;
  }
  return 0;
}

async function main(): Promise<number> {
  const [command, ...args] = process.argv.slice(2);
  switch (command) {
    case "check":
      return runCheck(args);
    case "merge":
      return runMerge(args);
    case "runway":
      return runRunway(args);
    case "draft":
      return runDraft(args);
    case "models":
      return runModels();
    default:
      console.log(
        "Commands: draft --out <file>, check <draft-file>, merge <draft-file>, runway [--min <days>], models",
      );
      return 2;
  }
}

main().then(
  (code) => {
    process.exitCode = code;
  },
  (error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  },
);
