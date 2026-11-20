import { CATEGORY_IDS, type CategoryId } from "../../src/games/peak-order/categories";
import { isUsableName, type Binding } from "../../src/games/peak-order/items";
import type { LocalNames } from "../../src/games/peak-order/localNames";
import type { Locale } from "../../src/i18n/locales";

export const NAME_LOCALES: readonly Exclude<Locale, "en">[] = ["es", "fr", "it", "de", "uk"];

export type LabelsById = Map<string, Map<string, string>>;

interface SparqlCell {
  value: string;
}

export function buildNamesQuery(ids: readonly string[]): string {
  const languages = NAME_LOCALES.map((locale) => `"${locale}"`).join(", ");
  return `SELECT ?item ?lang ?label WHERE {
  VALUES ?item { ${ids.map((id) => `wd:${id}`).join(" ")} }
  ?item rdfs:label ?label .
  BIND(LANG(?label) AS ?lang)
  FILTER(?lang IN (${languages}))
}
`;
}

export function parseNameRows(json: unknown): LabelsById {
  const rows = (json as { results?: { bindings?: Record<string, SparqlCell>[] } }).results
    ?.bindings;
  if (!Array.isArray(rows)) {
    throw new Error("The response has no results.bindings list");
  }
  return rows.reduce<LabelsById>((labels, row) => {
    const id = row.item.value.split("/").pop() ?? "";
    const known = labels.get(id) ?? new Map<string, string>();
    known.set(row.lang.value, row.label.value);
    return labels.set(id, known);
  }, new Map());
}

export function mergeLabels(first: LabelsById, second: LabelsById): LabelsById {
  return new Map([...first, ...second]);
}

export function findIdsByName(bindings: readonly Binding[]): Map<string, string> {
  return bindings.reduce(
    (ids, binding) => (ids.has(binding.name) ? ids : ids.set(binding.name, binding.id)),
    new Map<string, string>(),
  );
}

export function pickLocalName(
  id: string,
  english: string,
  label: string | undefined,
): string | null {
  return label !== undefined && label !== english && isUsableName(id, label) ? label : null;
}

export function buildLocalNames(
  namesByCategory: Readonly<Record<CategoryId, readonly string[]>>,
  idsByCategory: Readonly<Record<CategoryId, ReadonlyMap<string, string>>>,
  labels: LabelsById,
  locale: string,
): LocalNames {
  return Object.fromEntries(
    CATEGORY_IDS.map((category) => [
      category,
      Object.fromEntries(
        namesByCategory[category].flatMap((name) => {
          const id = idsByCategory[category].get(name);
          const local =
            id === undefined ? null : pickLocalName(id, name, labels.get(id)?.get(locale));
          return local === null ? [] : [[name, local]];
        }),
      ),
    ]),
  ) as LocalNames;
}
