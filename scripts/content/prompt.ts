import type { Country } from "../../src/core/types";
import { CLUE_KINDS, type Difficulty } from "../../src/games/mystery-place/types";

const DEFAULT_EXCERPT_CHARS = 14000;
const LEAD_CHARS = 3000;
const SECTION_CHARS = 1800;
const HEADING_PATTERN = /\n={2,}\s*([^=\n]+?)\s*={2,}\n/g;

const PRIORITY_HEADINGS = [
  "geography",
  "history",
  "culture",
  "cuisine",
  "sport",
  "economy",
  "demographics",
  "etymology",
  "wildlife",
  "climate",
  "environment",
  "tourism",
  "language",
  "religion",
  "flora",
  "fauna",
  "biodiversity",
  "architecture",
  "music",
  "festival",
];

const SKIPPED_HEADINGS = [
  "references",
  "external links",
  "see also",
  "notes",
  "further reading",
  "sources",
  "bibliography",
];

interface Section {
  heading: string;
  body: string;
}

function splitSections(text: string): { lead: string; sections: Section[] } {
  const matches = [...text.matchAll(HEADING_PATTERN)];
  if (matches.length === 0) {
    return { lead: text, sections: [] };
  }
  const lead = text.slice(0, matches[0].index);
  const sections = matches.map((match, index) => {
    const start = (match.index ?? 0) + match[0].length;
    const end = index + 1 < matches.length ? matches[index + 1].index : text.length;
    return { heading: match[1], body: text.slice(start, end).trim() };
  });
  return { lead, sections };
}

function rankSection(heading: string): number {
  const lower = heading.toLowerCase();
  if (SKIPPED_HEADINGS.some((skipped) => lower === skipped)) {
    return -1;
  }
  const index = PRIORITY_HEADINGS.findIndex((keyword) => lower.includes(keyword));
  return index === -1 ? PRIORITY_HEADINGS.length : index;
}

export function selectArticleExcerpt(
  text: string,
  maxChars: number = DEFAULT_EXCERPT_CHARS,
): string {
  const { lead, sections } = splitSections(text);
  const parts = [lead.trim().slice(0, LEAD_CHARS)];
  let used = parts[0].length;
  const ranked = sections
    .map((section, order) => ({ section, order, rank: rankSection(section.heading) }))
    .filter((entry) => entry.rank >= 0 && entry.section.body !== "")
    .sort((a, b) => a.rank - b.rank || a.order - b.order);
  for (const { section } of ranked) {
    const piece = `== ${section.heading} ==\n${section.body.slice(0, SECTION_CHARS)}`;
    if (used + piece.length <= maxChars) {
      parts.push(piece);
      used += piece.length;
    }
  }
  return parts.join("\n\n");
}

export function buildSystemPrompt(): string {
  return [
    "You write clues for a daily geography guessing game in which players identify a mystery country.",
    "You work only from the ARTICLE the user supplies and never add facts from memory.",
    "Reply with a single JSON object and nothing else: no markdown, no commentary.",
  ].join(" ");
}

export interface UserPromptInput {
  country: Country;
  difficulty: Difficulty;
  articleTitle: string;
  excerpt: string;
  feedback?: readonly string[];
}

const DIFFICULTY_GUIDANCE: Record<Difficulty, string> = {
  easy: "easy: use iconic, widely known facts, so most players can name the country by clue 3 or 4.",
  medium:
    "medium: mix well-known facts with less obvious ones, so players need clue 3 or 4 to be sure.",
  hard: "hard: rely on less obvious facts, so only clue 4 or 5 makes the answer clear to most players.",
};

export function buildUserPrompt(input: UserPromptInput): string {
  const { country, difficulty, articleTitle, excerpt, feedback = [] } = input;
  const forbidden = [country.name, ...country.aliases, ...(country.demonyms ?? [])];
  const lines = [
    `The mystery country is ${country.name}. Difficulty: ${DIFFICULTY_GUIDANCE[difficulty]}`,
    "",
    "Write exactly 5 clues ordered from vague, where many countries could fit, to specific, where the answer is nearly obvious.",
    "",
    "Rules:",
    "- Each clue is one sentence of at most 150 characters.",
    '- Each clue rests on exactly one passage of the ARTICLE. Copy that passage into "quote" character for character, between 25 and 220 characters, with no ellipsis and no changes.',
    "- Every number or year in a clue must appear as digits in its quote.",
    `- Never write any of these words in a clue or the fun fact: ${forbidden.join(", ")}.`,
    `- Use the kinds ${CLUE_KINDS.join(", ")} and at least 3 different kinds across the 5 clues.`,
    "- Do not state anything the quote does not say.",
    "- Add one fun fact, a different fact from the clues, as a single sentence of at most 200 characters, with its own quote.",
    "",
    "Reply with exactly this JSON shape:",
    '{"clues":[{"kind":"geography","text":"...","quote":"..."}],"funFact":{"text":"...","quote":"..."}}',
    "",
    ...(feedback.length > 0
      ? [
          "Your previous attempt was rejected. Fix every one of these problems:",
          ...feedback.map((message) => `- ${message}`),
          "",
        ]
      : []),
    `ARTICLE (Wikipedia: ${articleTitle}):`,
    excerpt,
  ];
  return lines.join("\n");
}
