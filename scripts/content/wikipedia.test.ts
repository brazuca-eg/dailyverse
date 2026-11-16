import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  buildExtractUrl,
  createArticleFetcher,
  extractArticleText,
  toWikipediaUrl,
  type FetchLike,
  type FetchResponseLike,
} from "./wikipedia";

function createResponse(
  status: number,
  body: unknown,
  headers: Record<string, string> = {},
): FetchResponseLike {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: (name) => headers[name.toLowerCase()] ?? null },
    json: async () => body,
  };
}

function createArticleBody(text: string): unknown {
  return { query: { pages: { "1": { title: "x", extract: text } } } };
}

describe("toWikipediaUrl", () => {
  it("builds a canonical article URL", () => {
    expect(toWikipediaUrl("New Zealand")).toBe("https://en.wikipedia.org/wiki/New_Zealand");
    expect(toWikipediaUrl("Iguazú Falls")).toBe("https://en.wikipedia.org/wiki/Iguaz%C3%BA_Falls");
    expect(toWikipediaUrl("University of al-Qarawiyyin")).toBe(
      "https://en.wikipedia.org/wiki/University_of_al-Qarawiyyin",
    );
  });
});

describe("buildExtractUrl", () => {
  it("encodes the title in the query", () => {
    expect(buildExtractUrl("Côte d'Ivoire")).toContain("titles=C%C3%B4te%20d'Ivoire");
  });
});

describe("extractArticleText", () => {
  it("reads the extract of the first page", () => {
    expect(extractArticleText(createArticleBody("Some text"))).toBe("Some text");
  });

  it("returns an empty string for unexpected shapes", () => {
    expect(extractArticleText(null)).toBe("");
    expect(extractArticleText({ query: {} })).toBe("");
    expect(extractArticleText({ query: { pages: { "-1": { missing: "" } } } })).toBe("");
  });
});

describe("createArticleFetcher", () => {
  let cacheDir = "";

  beforeEach(() => {
    cacheDir = mkdtempSync(join(tmpdir(), "dailyverse-wiki-"));
  });

  afterEach(() => {
    rmSync(cacheDir, { recursive: true, force: true });
  });

  it("fetches an article once and then serves it from the cache", async () => {
    let calls = 0;
    const fetchImpl: FetchLike = async () => {
      calls += 1;
      return createResponse(200, createArticleBody("Cached text"));
    };
    const fetchArticle = createArticleFetcher({
      cacheDir,
      delayMs: 0,
      fetchImpl,
      sleep: async () => {},
    });
    expect(await fetchArticle("Slovenia")).toBe("Cached text");
    expect(await fetchArticle("Slovenia")).toBe("Cached text");
    expect(calls).toBe(1);
  });

  it("waits for the retry-after delay when rate limited, then succeeds", async () => {
    const responses = [
      createResponse(429, {}, { "retry-after": "7" }),
      createResponse(200, createArticleBody("Second try")),
    ];
    const sleeps: number[] = [];
    const fetchImpl: FetchLike = async () => responses.shift() as FetchResponseLike;
    const fetchArticle = createArticleFetcher({
      cacheDir,
      delayMs: 100,
      fetchImpl,
      sleep: async (millis) => {
        sleeps.push(millis);
      },
    });
    expect(await fetchArticle("Slovenia")).toBe("Second try");
    expect(sleeps).toEqual([100, 7000, 100]);
  });

  it("gives up after too many rate limit responses", async () => {
    const fetchImpl: FetchLike = async () => createResponse(429, {});
    const fetchArticle = createArticleFetcher({
      cacheDir,
      maxAttempts: 2,
      fetchImpl,
      sleep: async () => {},
    });
    await expect(fetchArticle("Slovenia")).rejects.toThrow("kept rate limiting");
  });

  it("fails clearly when the page does not exist", async () => {
    const fetchImpl: FetchLike = async () =>
      createResponse(200, { query: { pages: { "-1": {} } } });
    const fetchArticle = createArticleFetcher({ cacheDir, fetchImpl, sleep: async () => {} });
    await expect(fetchArticle("Atlantis")).rejects.toThrow('"Atlantis" was not found');
  });

  it("fails clearly on a server error", async () => {
    const fetchImpl: FetchLike = async () => createResponse(500, {});
    const fetchArticle = createArticleFetcher({ cacheDir, fetchImpl, sleep: async () => {} });
    await expect(fetchArticle("Slovenia")).rejects.toThrow("HTTP 500");
  });
});
