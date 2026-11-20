import type { Locale } from "../../i18n/locales";
import type { ResultFact } from "../../ui/ResultPanel";
import factsData from "./facts.json";

const flagFacts: Record<string, ResultFact> = factsData;

export type LocalFacts = Record<string, { funFact: string }>;

const loaders = import.meta.glob<{ default: LocalFacts }>("./facts.*.json");

export function findFlagFact(code: string, local: LocalFacts | null = null): ResultFact | null {
  const fact = flagFacts[code] ?? null;
  const funFact = local?.[code]?.funFact;
  return fact && funFact ? { ...fact, funFact } : fact;
}

export async function loadLocalFacts(locale: Locale): Promise<LocalFacts | null> {
  const load = loaders[`./facts.${locale}.json`];
  return load ? (await load()).default : null;
}
