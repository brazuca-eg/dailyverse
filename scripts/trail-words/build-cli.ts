import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { buildTrailData } from "./build";

const CACHE_DIR = new URL("../../.cache/trail-words/", import.meta.url);
const WORDS_PATH = new URL("../../src/games/trail-words/words.txt", import.meta.url);
const PUZZLES_PATH = new URL("../../src/games/trail-words/puzzles.json", import.meta.url);

const SCOWL_URL =
  "https://app.aspell.net/create?spelling=US&max_variant=0&diacritic=strip&download=wordlist&encoding=utf-8&format=inline&max_size=";
const SOURCES = {
  enable: "https://raw.githubusercontent.com/dolph/dictionary/master/enable1.txt",
  common: `${SCOWL_URL}50`,
  accepted: `${SCOWL_URL}70`,
  blocklist:
    "https://raw.githubusercontent.com/LDNOOBW/List-of-Dirty-Naughty-Obscene-and-Otherwise-Bad-Words/master/en",
} as const;

async function readSource(name: keyof typeof SOURCES): Promise<string> {
  const path = new URL(`${name}.txt`, CACHE_DIR);
  if (!existsSync(path)) {
    const response = await fetch(SOURCES[name]);
    if (!response.ok) {
      throw new Error(`Could not download ${name}: HTTP ${response.status}`);
    }
    mkdirSync(CACHE_DIR, { recursive: true });
    writeFileSync(path, await response.text());
  }
  return readFileSync(path, "utf8");
}

async function run(): Promise<void> {
  const data = buildTrailData({
    enableText: await readSource("enable"),
    commonText: await readSource("common"),
    acceptedText: await readSource("accepted"),
    blocklistText: await readSource("blocklist"),
  });
  writeFileSync(WORDS_PATH, data.wordFile);
  writeFileSync(PUZZLES_PATH, JSON.stringify(data.puzzles));
  console.log(
    `${data.wordCount} words (${data.commonCount} common). Candidates: ${data.candidateCounts.medium} medium, ${data.candidateCounts.hard} hard. Pool: ${data.puzzles.medium.length} medium, ${data.puzzles.hard.length} hard.`,
  );
}

run();
