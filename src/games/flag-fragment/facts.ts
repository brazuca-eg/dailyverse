import type { ResultFact } from "../../ui/ResultPanel";
import factsData from "./facts.json";

const flagFacts: Record<string, ResultFact> = factsData;

export function findFlagFact(code: string): ResultFact | null {
  return flagFacts[code] ?? null;
}
