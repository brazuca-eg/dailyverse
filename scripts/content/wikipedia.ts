import { mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { isRecord } from "../../src/core/guards";
import { readRetryAfterSeconds } from "./retry";

export interface FetchResponseLike {
  ok: boolean;
  status: number;
  headers: { get(name: string): string | null };
  json(): Promise<unknown>;
  text?(): Promise<string>;
}

export interface FetchInit {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
}

export type FetchLike = (url: string, init?: FetchInit) => Promise<FetchResponseLike>;

export interface ArticleFetcherOptions {
  cacheDir: string;
  delayMs: number;
  maxAttempts: number;
  defaultRetrySeconds: number;
  fetchImpl: FetchLike;
  sleep: (millis: number) => Promise<void>;
}

const USER_AGENT = "dailyverse-content-check/0.1";

export function toWikipediaUrl(title: string): string {
  return `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, "_"))}`;
}

export function buildExtractUrl(title: string): string {
  return (
    "https://en.wikipedia.org/w/api.php?action=query&prop=extracts&explaintext=1" +
    `&redirects=1&format=json&titles=${encodeURIComponent(title)}`
  );
}

export function extractArticleText(body: unknown): string {
  if (!isRecord(body) || !isRecord(body.query) || !isRecord(body.query.pages)) {
    return "";
  }
  const firstPage = Object.values(body.query.pages)[0];
  if (!isRecord(firstPage) || typeof firstPage.extract !== "string") {
    return "";
  }
  return firstPage.extract;
}

function toCacheFileName(title: string): string {
  return `${title.replace(/[^A-Za-z0-9]+/g, "_")}.txt`;
}

function readCachedText(path: string): string | null {
  try {
    return statSync(path).size > 0 ? readFileSync(path, "utf8") : null;
  } catch {
    return null;
  }
}

async function readArticleText(response: FetchResponseLike, title: string): Promise<string> {
  if (!response.ok) {
    throw new Error(`Wikipedia returned HTTP ${response.status} for "${title}"`);
  }
  const text = extractArticleText(await response.json());
  if (text === "") {
    throw new Error(`Wikipedia page "${title}" was not found or has no text`);
  }
  return text;
}

export function createArticleFetcher(
  overrides: Partial<ArticleFetcherOptions> = {},
): (title: string) => Promise<string> {
  const options: ArticleFetcherOptions = {
    cacheDir: join(process.cwd(), ".cache", "wikipedia"),
    delayMs: 1500,
    maxAttempts: 5,
    defaultRetrySeconds: 15,
    fetchImpl: fetch as unknown as FetchLike,
    sleep: (millis) => new Promise((resolve) => setTimeout(resolve, millis)),
    ...overrides,
  };

  return async function fetchArticleText(title: string): Promise<string> {
    const cachePath = join(options.cacheDir, toCacheFileName(title));
    const cached = readCachedText(cachePath);
    if (cached !== null) {
      return cached;
    }
    for (let attempt = 1; attempt <= options.maxAttempts; attempt += 1) {
      await options.sleep(options.delayMs);
      const response = await options.fetchImpl(buildExtractUrl(title), {
        headers: { "User-Agent": USER_AGENT },
      });
      if (response.status === 429) {
        const retrySeconds = readRetryAfterSeconds(
          response.headers.get("retry-after"),
          options.defaultRetrySeconds,
        );
        await options.sleep(retrySeconds * 1000);
      } else {
        const text = await readArticleText(response, title);
        mkdirSync(options.cacheDir, { recursive: true });
        writeFileSync(cachePath, text, "utf8");
        return text;
      }
    }
    throw new Error(`Wikipedia kept rate limiting the request for "${title}"`);
  };
}
