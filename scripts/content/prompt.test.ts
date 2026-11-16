import { describe, expect, it } from "vitest";
import { buildSystemPrompt, buildUserPrompt, selectArticleExcerpt } from "./prompt";
import { requireCountry } from "../../src/core/testing";

const italy = requireCountry("IT");

function createArticle(): string {
  return [
    "Lead sentence about the place. ".repeat(10),
    "",
    "== Etymology ==",
    "The name comes from an old word.",
    "",
    "== History ==",
    "A long history. ".repeat(40),
    "",
    "== Government ==",
    "Boring details about parliament.",
    "",
    "== Geography ==",
    "Mountains and rivers. ".repeat(40),
    "",
    "== References ==",
    "Reference list that must never be shown.",
    "",
    "== External links ==",
    "Official website",
  ].join("\n");
}

describe("selectArticleExcerpt", () => {
  it("keeps the lead and the useful sections and drops references", () => {
    const excerpt = selectArticleExcerpt(createArticle());
    expect(excerpt).toContain("Lead sentence about the place.");
    expect(excerpt).toContain("== History ==");
    expect(excerpt).toContain("== Geography ==");
    expect(excerpt).not.toContain("Reference list");
    expect(excerpt).not.toContain("Official website");
  });

  it("puts priority sections before others", () => {
    const excerpt = selectArticleExcerpt(createArticle());
    expect(excerpt.indexOf("== Geography ==")).toBeLessThan(excerpt.indexOf("== Government =="));
  });

  it("never exceeds the character budget", () => {
    const excerpt = selectArticleExcerpt(createArticle(), 900);
    expect(excerpt.length).toBeLessThanOrEqual(900);
    expect(excerpt).toContain("Lead sentence");
  });

  it("truncates a very long lead and long sections", () => {
    const huge = `${"x".repeat(10000)}\n\n== History ==\n${"y".repeat(10000)}`;
    const excerpt = selectArticleExcerpt(huge);
    expect(excerpt.length).toBeLessThan(5500);
  });

  it("returns the text itself when there are no headings", () => {
    expect(selectArticleExcerpt("Just one paragraph.")).toBe("Just one paragraph.");
  });

  it("only returns text that is present in the article", () => {
    const article = createArticle();
    const normalizedArticle = article.replace(/\s+/g, " ");
    for (const line of selectArticleExcerpt(article)
      .split("\n")
      .filter((entry) => entry && !entry.startsWith("=="))) {
      expect(normalizedArticle).toContain(line.replace(/\s+/g, " ").trim());
    }
  });
});

describe("buildSystemPrompt", () => {
  it("demands JSON only and forbids outside facts", () => {
    const prompt = buildSystemPrompt();
    expect(prompt).toContain("single JSON object");
    expect(prompt).toContain("never add facts from memory");
  });
});

describe("buildUserPrompt", () => {
  const base = {
    country: italy,
    difficulty: "easy" as const,
    articleTitle: "Italy",
    excerpt: "EXCERPT TEXT",
  };

  it("states the country, difficulty, rules and the article", () => {
    const prompt = buildUserPrompt(base);
    expect(prompt).toContain("The mystery country is Italy.");
    expect(prompt).toContain("easy:");
    expect(prompt).toContain("exactly 5 clues");
    expect(prompt).toContain("ARTICLE (Wikipedia: Italy):\nEXCERPT TEXT");
  });

  it("lists the forbidden name and nationality words", () => {
    expect(buildUserPrompt(base)).toContain("Italy, Italian");
  });

  it("lists every allowed clue kind", () => {
    expect(buildUserPrompt(base)).toContain("geography, climate, wildlife");
  });

  it("includes feedback only when there is some", () => {
    expect(buildUserPrompt(base)).not.toContain("previous attempt");
    const prompt = buildUserPrompt({ ...base, feedback: ["clue 2: the quote was not found"] });
    expect(prompt).toContain("Your previous attempt was rejected");
    expect(prompt).toContain("- clue 2: the quote was not found");
  });
});
