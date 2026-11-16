import { isRecord } from "../../src/core/guards";
import type { Country } from "../../src/core/types";
import type { ClueKind, Difficulty } from "../../src/games/mystery-place/types";
import type { DraftPuzzle } from "./types";
import { toWikipediaUrl } from "./wikipedia";

export interface ReplyClue {
  kind: string;
  text: string;
  quote: string;
}

export interface ModelReply {
  clues: ReplyClue[];
  funFact: { text: string; quote: string };
}

export function extractJsonText(reply: string): string {
  const fenced = /```(?:json)?\s*([\s\S]*?)```/i.exec(reply);
  const candidate = fenced ? fenced[1] : reply;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end <= start) {
    throw new Error("the reply contained no JSON object");
  }
  return candidate.slice(start, end + 1);
}

function requireText(record: Record<string, unknown>, key: string, where: string): string {
  const value = record[key];
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${where}.${key} must be a non-empty string`);
  }
  return value.trim();
}

export function parseModelReply(reply: string): ModelReply {
  let parsed: unknown;
  try {
    parsed = JSON.parse(extractJsonText(reply));
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(`the reply was not valid JSON (${reason})`, { cause: error });
  }
  if (!isRecord(parsed) || !Array.isArray(parsed.clues) || !isRecord(parsed.funFact)) {
    throw new Error('the reply must be an object with a "clues" array and a "funFact" object');
  }
  const clues = parsed.clues.map((clue, index) => {
    if (!isRecord(clue)) {
      throw new Error(`clues[${index}] must be an object`);
    }
    const where = `clues[${index}]`;
    return {
      kind: requireText(clue, "kind", where),
      text: requireText(clue, "text", where),
      quote: requireText(clue, "quote", where),
    };
  });
  return {
    clues,
    funFact: {
      text: requireText(parsed.funFact, "text", "funFact"),
      quote: requireText(parsed.funFact, "quote", "funFact"),
    },
  };
}

export function buildDraftFromReply(
  reply: ModelReply,
  country: Country,
  difficulty: Difficulty,
  pageTitle: string,
): DraftPuzzle {
  return {
    country: country.code,
    difficulty,
    clues: reply.clues.map((clue) => ({
      kind: clue.kind as ClueKind,
      text: clue.text,
      evidence: { page: pageTitle, quote: clue.quote },
    })),
    reveal: {
      funFact: reply.funFact.text,
      sourceUrl: toWikipediaUrl(pageTitle),
      evidence: { page: pageTitle, quote: reply.funFact.quote },
    },
  };
}
