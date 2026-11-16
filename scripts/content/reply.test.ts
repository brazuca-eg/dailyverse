import { describe, expect, it } from "vitest";
import { createValidReply } from "./fixtures";
import { buildDraftFromReply, extractJsonText, parseModelReply } from "./reply";
import { requireCountry } from "../../src/core/testing";

const slovenia = requireCountry("SI");

describe("extractJsonText", () => {
  it("returns plain JSON unchanged", () => {
    expect(extractJsonText('{"a":1}')).toBe('{"a":1}');
  });

  it("unwraps a fenced block", () => {
    expect(extractJsonText('Here you go:\n```json\n{"a":1}\n```\nEnjoy')).toBe('{"a":1}');
  });

  it("finds JSON surrounded by commentary", () => {
    expect(extractJsonText('Sure! {"a":{"b":2}} Hope that helps.')).toBe('{"a":{"b":2}}');
  });

  it("throws when there is no JSON object", () => {
    expect(() => extractJsonText("no braces here")).toThrow("no JSON object");
  });
});

describe("parseModelReply", () => {
  it("parses a well-formed reply, including one in a fence", () => {
    const text = `\`\`\`json\n${JSON.stringify(createValidReply())}\n\`\`\``;
    expect(parseModelReply(text)).toEqual(createValidReply());
  });

  it("explains invalid JSON", () => {
    expect(() => parseModelReply("{not json}")).toThrow("not valid JSON");
  });

  it("requires the clues array and fun fact", () => {
    expect(() => parseModelReply('{"clues":[]}')).toThrow('"clues" array and a "funFact" object');
  });

  it("points at the clue that is missing a field", () => {
    const reply = createValidReply();
    delete (reply.clues[3] as Partial<(typeof reply.clues)[number]>).quote;
    expect(() => parseModelReply(JSON.stringify(reply))).toThrow(
      "clues[3].quote must be a non-empty string",
    );
  });

  it("rejects non-object clues", () => {
    const broken = { clues: ["text"], funFact: { text: "t", quote: "q" } };
    expect(() => parseModelReply(JSON.stringify(broken))).toThrow("clues[0] must be an object");
  });

  it("rejects an empty fun fact", () => {
    const reply = { ...createValidReply(), funFact: { text: " ", quote: "q" } };
    expect(() => parseModelReply(JSON.stringify(reply))).toThrow(
      "funFact.text must be a non-empty string",
    );
  });
});

describe("buildDraftFromReply", () => {
  it("adds the country, difficulty, article page and canonical source link", () => {
    const draft = buildDraftFromReply(
      parseModelReply(JSON.stringify(createValidReply())),
      slovenia,
      "hard",
      "Slovenia",
    );
    expect(draft.country).toBe("SI");
    expect(draft.difficulty).toBe("hard");
    expect(draft.clues).toHaveLength(5);
    expect(draft.clues[0].evidence).toEqual({
      page: "Slovenia",
      quote: createValidReply().clues[0].quote,
    });
    expect(draft.reveal.sourceUrl).toBe("https://en.wikipedia.org/wiki/Slovenia");
    expect(draft.reveal.evidence.page).toBe("Slovenia");
  });
});
