import { readFileSync, writeFileSync } from "node:fs";
import type { Country } from "../../src/core/types";
import { createArticleFetcher } from "../content/wikipedia";
import { collectFactIssues, deriveFlagFacts, listFactPages, type FlagFactDraft } from "./facts";

const COUNTRIES_PATH = new URL("../../src/core/countries.json", import.meta.url);
const DRAFTS_PATH = new URL("../../content/flag-facts.json", import.meta.url);
const OUTPUT_PATH = new URL("../../src/games/flag-fragment/facts.json", import.meta.url);

async function fetchSources(pages: readonly string[]): Promise<Map<string, string>> {
  const fetchArticleText = createArticleFetcher();
  const sources = new Map<string, string>();
  for (const page of pages) {
    sources.set(page, await fetchArticleText(page));
  }
  return sources;
}

async function run(): Promise<void> {
  const countries = JSON.parse(readFileSync(COUNTRIES_PATH, "utf8")) as Country[];
  const drafts = JSON.parse(readFileSync(DRAFTS_PATH, "utf8")) as FlagFactDraft[];
  const sources = await fetchSources(listFactPages(drafts));
  const issues = collectFactIssues(
    drafts,
    countries.map((country) => country.code),
    sources,
  );
  if (issues.length > 0) {
    console.error(issues.join("\n"));
    process.exitCode = 1;
    return;
  }
  writeFileSync(OUTPUT_PATH, JSON.stringify(deriveFlagFacts(drafts)));
  console.log(`Checked ${drafts.length} facts against ${sources.size} articles.`);
}

run();
