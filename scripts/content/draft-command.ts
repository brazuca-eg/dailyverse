import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { countries } from "../../src/core/countries";
import { isRecord } from "../../src/core/guards";
import { puzzles } from "../../src/games/mystery-place/data";
import { readFlag } from "./args";
import { generateBatch, type BatchResult } from "./draft";
import { ChatCompletionsGenerator, listModelIds, loadLlmConfig } from "./llm";
import { planBatch } from "./plan";
import { buildSystemPrompt, buildUserPrompt, selectArticleExcerpt } from "./prompt";
import { buildReviewSheet } from "./review";
import { getWikipediaTitle } from "./titles";
import { createArticleFetcher } from "./wikipedia";

const DRAFTS_DIR = join(process.cwd(), "content", "drafts");
const DEFAULT_COUNT = 7;
const MAX_COUNT = 14;
const PROMPT_PREVIEW_CHARS = 1800;

function createTodaySeed(): number {
  return Number(new Date().toISOString().slice(0, 10).replace(/-/g, ""));
}

function readPendingDraftCodes(): string[] {
  let files: string[];
  try {
    files = readdirSync(DRAFTS_DIR).filter((file) => file.endsWith(".json"));
  } catch {
    return [];
  }
  return files.flatMap((file) => {
    try {
      const content: unknown = JSON.parse(readFileSync(join(DRAFTS_DIR, file), "utf8"));
      if (!Array.isArray(content)) {
        return [];
      }
      return content.flatMap((entry) =>
        isRecord(entry) && typeof entry.country === "string" ? [entry.country] : [],
      );
    } catch {
      return [];
    }
  });
}

function parseCount(value: string | undefined): number {
  const count = Number(value ?? DEFAULT_COUNT);
  if (!Number.isInteger(count) || count < 1 || count > MAX_COUNT) {
    throw new Error(`--count must be a whole number from 1 to ${MAX_COUNT}`);
  }
  return count;
}

async function printDryRun(
  planned: ReturnType<typeof planBatch>,
  fetchArticle: (title: string) => Promise<string>,
): Promise<void> {
  const [first] = planned;
  const title = getWikipediaTitle(first.country);
  const excerpt = selectArticleExcerpt(await fetchArticle(title));
  const prompt = buildUserPrompt({
    country: first.country,
    difficulty: first.difficulty,
    articleTitle: title,
    excerpt,
  });
  console.log("\nDry run: nothing was sent to a model.");
  console.log(`First prompt, for ${first.country.name}, is ${prompt.length} characters long:\n`);
  console.log(`SYSTEM: ${buildSystemPrompt()}\n`);
  console.log(`${prompt.slice(0, PROMPT_PREVIEW_CHARS)}\n...`);
}

export async function runDraft(args: readonly string[]): Promise<number> {
  const outPath = readFlag(args, "--out");
  if (!outPath) {
    console.log(
      "Usage: content:draft --out <file.json> [--count 7] [--review <file.md>] [--seed <n>] [--dry-run]",
    );
    return 2;
  }
  const count = parseCount(readFlag(args, "--count"));
  const seed = Number(readFlag(args, "--seed") ?? createTodaySeed());
  const unavailable = new Set([
    ...puzzles.map((puzzle) => puzzle.country),
    ...readPendingDraftCodes(),
  ]);
  const planned = planBatch(countries, unavailable, count, seed);
  if (planned.length === 0) {
    console.log("Every country already has a puzzle or a pending draft.");
    return 1;
  }
  console.log("Planned batch:");
  planned.forEach((entry, index) => {
    console.log(`  ${index + 1}. ${entry.country.name} (${entry.difficulty})`);
  });

  const fetchArticle = createArticleFetcher();
  if (args.includes("--dry-run")) {
    await printDryRun(planned, fetchArticle);
    return 0;
  }

  const result = await generateBatch(planned, {
    generator: new ChatCompletionsGenerator(loadLlmConfig(process.env)),
    fetchArticle,
    countries,
    existingCountryCodes: unavailable,
    log: (message) => console.log(message),
  });
  if (result.stoppedEarly) {
    console.log("\nThe model API failed twice in a row, so the batch stops here.");
  }
  console.log(`\n${result.drafts.length} drafted, ${result.skipped.length} skipped.`);
  if (result.drafts.length === 0) {
    return 1;
  }
  writeBatchFiles(result, outPath, readFlag(args, "--review"));
  return 0;
}

function writeBatchFiles(
  result: BatchResult,
  outPath: string,
  reviewPath: string | undefined,
): void {
  writeFileSync(outPath, `${JSON.stringify(result.drafts, null, 2)}\n`, "utf8");
  console.log(`Drafts written to ${outPath}`);
  if (reviewPath) {
    const sheet = buildReviewSheet(result.drafts, countries, result.warnings, result.skipped);
    writeFileSync(reviewPath, sheet, "utf8");
    console.log(`Review sheet written to ${reviewPath}`);
  }
}

export async function runModels(): Promise<number> {
  const config = loadLlmConfig({ ...process.env, LLM_MODEL: process.env.LLM_MODEL || "unused" });
  const ids = await listModelIds(config);
  if (ids.length === 0) {
    console.log("The provider returned no models.");
    return 1;
  }
  console.log(ids.join("\n"));
  return 0;
}
