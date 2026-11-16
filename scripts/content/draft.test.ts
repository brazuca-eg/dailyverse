import { describe, expect, it } from "vitest";
import { countries } from "../../src/core/countries";
import { generateBatch, generateDraft, type DraftDependencies } from "./draft";
import { createValidReply, SLOVENIA_TEXT } from "./fixtures";
import type { GenerationRequest, TextGenerator } from "./llm";
import type { PlannedPuzzle } from "./plan";
import { requireCountry } from "../../src/core/testing";

const planned: PlannedPuzzle = {
  country: requireCountry("SI"),
  difficulty: "hard",
};

function createGenerator(
  replies: (string | Error)[],
): TextGenerator & { requests: GenerationRequest[] } {
  const requests: GenerationRequest[] = [];
  return {
    requests,
    async generate(request) {
      requests.push(request);
      const next = replies.shift();
      if (next === undefined) {
        throw new Error("no more scripted replies");
      }
      if (next instanceof Error) {
        throw next;
      }
      return next;
    },
  };
}

function createDependencies(
  generator: TextGenerator,
  overrides: Partial<DraftDependencies> = {},
): DraftDependencies {
  return {
    generator,
    fetchArticle: async () => SLOVENIA_TEXT,
    countries,
    existingCountryCodes: new Set<string>(),
    ...overrides,
  };
}

const goodReply = JSON.stringify(createValidReply());

function createBadReply(): string {
  const reply = createValidReply();
  reply.clues[1].quote =
    "It borders Spain, Portugal and many places that are not in the article at all";
  return JSON.stringify(reply);
}

describe("generateDraft", () => {
  it("accepts a good reply on the first attempt", async () => {
    const generator = createGenerator([goodReply]);
    const outcome = await generateDraft(planned, createDependencies(generator));
    expect(outcome.draft?.country).toBe("SI");
    expect(outcome.failures).toEqual([]);
    expect(generator.requests).toHaveLength(1);
    expect(generator.requests[0].user).toContain("The mystery country is Slovenia.");
  });

  it("feeds the checker's complaints back and accepts the corrected reply", async () => {
    const generator = createGenerator([createBadReply(), goodReply]);
    const outcome = await generateDraft(planned, createDependencies(generator));
    expect(outcome.draft).toBeDefined();
    expect(generator.requests).toHaveLength(2);
    expect(generator.requests[0].user).not.toContain("previous attempt");
    expect(generator.requests[1].user).toContain("Your previous attempt was rejected");
    expect(generator.requests[1].user).toContain('clue 2: the quote was not found in "Slovenia"');
  });

  it("treats unparseable replies as a failed attempt and tells the model why", async () => {
    const generator = createGenerator(["I could not do that.", goodReply]);
    const outcome = await generateDraft(planned, createDependencies(generator));
    expect(outcome.draft).toBeDefined();
    expect(generator.requests[1].user).toContain("Your reply could not be used");
  });

  it("gives up after the maximum number of attempts and reports why", async () => {
    const generator = createGenerator([createBadReply(), createBadReply(), createBadReply()]);
    const outcome = await generateDraft(planned, createDependencies(generator));
    expect(outcome.draft).toBeUndefined();
    expect(outcome.apiFailed).toBe(false);
    expect(outcome.failures[0]).toContain("still failing after 3 attempts");
    expect(outcome.failures[0]).toContain("the quote was not found");
    expect(generator.requests).toHaveLength(3);
  });

  it("respects a custom attempt limit", async () => {
    const generator = createGenerator([createBadReply(), createBadReply()]);
    const outcome = await generateDraft(planned, createDependencies(generator, { maxAttempts: 1 }));
    expect(outcome.draft).toBeUndefined();
    expect(generator.requests).toHaveLength(1);
  });

  it("reports an API failure without retrying", async () => {
    const generator = createGenerator([new Error("HTTP 401: key not valid")]);
    const outcome = await generateDraft(planned, createDependencies(generator));
    expect(outcome.apiFailed).toBe(true);
    expect(outcome.failures[0]).toContain("the model API failed: HTTP 401");
    expect(generator.requests).toHaveLength(1);
  });

  it("reports an article that cannot be fetched and never calls the model", async () => {
    const generator = createGenerator([goodReply]);
    const outcome = await generateDraft(
      planned,
      createDependencies(generator, {
        fetchArticle: async () => {
          throw new Error("page not found");
        },
      }),
    );
    expect(outcome.failures[0]).toContain("could not fetch the article: page not found");
    expect(generator.requests).toHaveLength(0);
  });

  it("rejects a reply for a country that already has a puzzle", async () => {
    const generator = createGenerator([goodReply, goodReply, goodReply]);
    const outcome = await generateDraft(
      planned,
      createDependencies(generator, { existingCountryCodes: new Set(["SI"]) }),
    );
    expect(outcome.draft).toBeUndefined();
    expect(outcome.failures[0]).toContain("already has a published puzzle");
  });

  it("collects accepted drafts and skipped countries across a batch", async () => {
    const croatia: PlannedPuzzle = {
      country: requireCountry("HR"),
      difficulty: "medium",
    };
    const generator = createGenerator([
      goodReply,
      createBadReply(),
      createBadReply(),
      createBadReply(),
    ]);
    const result = await generateBatch([planned, croatia], createDependencies(generator));
    expect(result.drafts.map((draft) => draft.country)).toEqual(["SI"]);
    expect(result.skipped).toHaveLength(1);
    expect(result.skipped[0]).toContain("Croatia: still failing after 3 attempts");
    expect(result.stoppedEarly).toBe(false);
  });

  it("stops the batch after two API failures in a row", async () => {
    const entries = ["SI", "HR", "AT", "DE"].map((code) => ({
      country: requireCountry(code),
      difficulty: "easy" as const,
    }));
    const generator = createGenerator([
      new Error("HTTP 429"),
      new Error("HTTP 429"),
      goodReply,
      goodReply,
    ]);
    const result = await generateBatch(entries, createDependencies(generator));
    expect(result.drafts).toEqual([]);
    expect(result.skipped).toHaveLength(2);
    expect(result.stoppedEarly).toBe(true);
    expect(generator.requests).toHaveLength(2);
  });

  it("does not stop for a single API failure followed by success", async () => {
    const entries = ["HR", "SI"].map((code) => ({
      country: requireCountry(code),
      difficulty: "easy" as const,
    }));
    const generator = createGenerator([new Error("HTTP 503"), goodReply]);
    const result = await generateBatch(entries, createDependencies(generator));
    expect(result.skipped).toHaveLength(1);
    expect(result.drafts.map((draft) => draft.country)).toEqual(["SI"]);
    expect(result.stoppedEarly).toBe(false);
  });

  it("reports progress through the log", async () => {
    const lines: string[] = [];
    const generator = createGenerator([goodReply]);
    await generateBatch(
      [planned],
      createDependencies(generator, { log: (line) => lines.push(line) }),
    );
    expect(lines.some((line) => line.includes("Slovenia (hard)"))).toBe(true);
    expect(lines).toContain("  accepted");
  });

  it("keeps warnings from an accepted draft", async () => {
    const reply = createValidReply();
    reply.clues[2].text = "Central Europe.";
    const outcome = await generateDraft(
      planned,
      createDependencies(createGenerator([JSON.stringify(reply)])),
    );
    expect(outcome.draft).toBeDefined();
    expect(outcome.warnings.map((issue) => issue.message)).toEqual([
      "clue 3: 15 characters, aim for 20 to 170",
    ]);
  });
});
