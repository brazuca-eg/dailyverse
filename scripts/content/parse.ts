import { isRecord } from "../../src/core/guards";
import type { DraftClue, DraftPuzzle, DraftReveal, Evidence } from "./types";

function requireRecord(value: unknown, path: string): Record<string, unknown> {
  if (!isRecord(value)) {
    throw new Error(`${path} must be an object`);
  }
  return value;
}

function requireString(record: Record<string, unknown>, key: string, path: string): string {
  const value = record[key];
  if (typeof value !== "string") {
    throw new Error(`${path}.${key} must be a string`);
  }
  return value;
}

function parseEvidence(value: unknown, path: string): Evidence {
  const record = requireRecord(value, path);
  return {
    page: requireString(record, "page", path),
    quote: requireString(record, "quote", path),
  };
}

function parseClue(value: unknown, path: string): DraftClue {
  const record = requireRecord(value, path);
  return {
    kind: requireString(record, "kind", path) as DraftClue["kind"],
    text: requireString(record, "text", path),
    evidence: parseEvidence(record.evidence, `${path}.evidence`),
  };
}

function parseReveal(value: unknown, path: string): DraftReveal {
  const record = requireRecord(value, path);
  return {
    funFact: requireString(record, "funFact", path),
    sourceUrl: requireString(record, "sourceUrl", path),
    evidence: parseEvidence(record.evidence, `${path}.evidence`),
  };
}

function parseDraft(value: unknown, path: string): DraftPuzzle {
  const record = requireRecord(value, path);
  const clues = record.clues;
  if (!Array.isArray(clues)) {
    throw new Error(`${path}.clues must be an array`);
  }
  return {
    country: requireString(record, "country", path),
    difficulty: requireString(record, "difficulty", path) as DraftPuzzle["difficulty"],
    clues: clues.map((clue, index) => parseClue(clue, `${path}.clues[${index}]`)),
    reveal: parseReveal(record.reveal, `${path}.reveal`),
  };
}

export function parseDrafts(value: unknown): DraftPuzzle[] {
  if (!Array.isArray(value)) {
    throw new Error("The draft file must contain a JSON array of puzzles");
  }
  return value.map((draft, index) => parseDraft(draft, `drafts[${index}]`));
}
