import { describe, expect, it } from "vitest";
import { CATEGORY_IDS } from "../../src/games/peak-order/categories";
import { makeBindings, makeItems } from "../../src/games/peak-order/testing";
import { verifyPeakData } from "../../src/games/peak-order/verify";
import {
  BATCH_SIZE,
  CATEGORY_SOURCES,
  EXCLUDED_WIKIS,
  MAX_ROWS,
  buildEditionsQuery,
  buildOffEarthQuery,
  buildPeakData,
  buildQuery,
  type CategoryRows,
  type RowsByCategory,
} from "./build";

function rowsFor(count: number, factor: number, tag = "A"): CategoryRows {
  const rows = makeBindings(count, 1.04, factor).map((row) => ({ ...row, id: `${tag}${row.id}` }));
  return {
    rows,
    editions: new Map(rows.map((row) => [row.id, row.links - 20])),
    offEarth: new Set(),
  };
}

function build(overrides: Partial<RowsByCategory> = {}) {
  const rows = Object.fromEntries(
    CATEGORY_IDS.map((category, index) => [
      category,
      rowsFor(320, CATEGORY_SOURCES[category].factor, `C${index}`),
    ]),
  ) as RowsByCategory;
  return buildPeakData({ ...rows, ...overrides });
}

describe("buildQuery", () => {
  it("asks for the class and property of the category, with sitelinks, in English", () => {
    const query = buildQuery(CATEGORY_SOURCES.rivers);
    expect(query).toContain("wdt:P31 wd:Q4022");
    expect(query).toContain("p:P2043/psn:P2043/wikibase:quantityAmount");
    expect(query).toContain("wikibase:sitelinks");
    expect(query).toContain('wikibase:language "en"');
    expect(query).toContain(`LIMIT ${MAX_ROWS}`);
  });

  it("uses a different class for each category, in the right unit", () => {
    const classes = CATEGORY_IDS.map((category) => CATEGORY_SOURCES[category].wikidataClass);
    expect(new Set(classes).size).toBe(5);
    expect(CATEGORY_SOURCES.rivers.factor).toBe(0.001);
    expect(CATEGORY_SOURCES.lakes.factor).toBe(0.000001);
    expect(CATEGORY_SOURCES.mountains.factor).toBe(1);
  });
});

describe("buildEditionsQuery", () => {
  it("counts Wikipedia editions for the given items, without the bot-written wikis", () => {
    const query = buildEditionsQuery(["Q1", "Q2"]);
    expect(query).toContain("VALUES ?item { wd:Q1 wd:Q2 }");
    EXCLUDED_WIKIS.forEach((wiki) =>
      expect(query).toContain(`!CONTAINS(STR(?site), "//${wiki}.")`),
    );
    expect(query).toContain("GROUP BY ?item");
    expect(EXCLUDED_WIKIS).toEqual(["ceb", "sv", "war"]);
  });

  it("is asked in batches that Wikidata answers quickly", () => {
    expect(BATCH_SIZE).toBeLessThanOrEqual(100);
  });
});

describe("buildOffEarthQuery", () => {
  it("finds items located on a body other than Earth", () => {
    const query = buildOffEarthQuery(["Q1", "Q2"]);
    expect(query).toContain("VALUES ?item { wd:Q1 wd:Q2 }");
    expect(query).toContain("wdt:P376");
    expect(query).toContain("FILTER(?body != wd:Q2)");
  });
});

describe("buildPeakData", () => {
  const data = build();

  it("builds all categories, and the result passes the verifier", () => {
    expect(Object.keys(data)).toEqual([...CATEGORY_IDS]);
    expect(verifyPeakData(data)).toEqual([]);
  });

  it("stores only the used items, in order of value, and puzzles as indexes", () => {
    CATEGORY_IDS.forEach((category) => {
      const { items, medium, hard } = data[category];
      expect(new Set([...medium, ...hard].flat()).size).toBe(items.length);
      medium.forEach((set) =>
        expect(set.map((index) => items[index][1])).toEqual(
          [...set.map((index) => items[index][1])].sort((a, b) => a - b),
        ),
      );
    });
  });

  it("scales values by the factor of the category", () => {
    const expected = new Set(makeItems(320).map((item) => item.value));
    const kilometres = data.rivers.items.map((item) => item[1]);
    expect(kilometres.length).toBeGreaterThan(0);
    kilometres.forEach((value) => expect(expected.has(value)).toBe(true));
  });

  it("removes items that are located off Earth", () => {
    const base = rowsFor(320, CATEGORY_SOURCES.rivers.factor, "R");
    const target = data.rivers.items[0][0];
    const targetId = base.rows.find((row) => row.name === target)?.id as string;
    const result = build({ rivers: { ...base, offEarth: new Set([targetId]) } });
    expect(result.rivers.items.map((item) => item[0])).not.toContain(target);
    expect(build({ rivers: base }).rivers.items.map((item) => item[0])).toContain(target);
  });

  it("keeps an object that is both a mountain and a volcano in the volcanoes only", () => {
    const factor = CATEGORY_SOURCES.mountains.factor;
    const all = makeBindings(640, 1.04, factor);
    const toRows = (rows: typeof all): CategoryRows => ({
      rows,
      editions: new Map(rows.map((row) => [row.id, 200])),
      offEarth: new Set(),
    });
    const shared = all.slice(0, 320);
    const result = build({ mountains: toRows(all), volcanoes: toRows(shared) });
    const sharedNames = new Set(shared.map((row) => row.name));
    result.mountains.items.forEach((item) => expect(sharedNames.has(item[0])).toBe(false));
    expect(result.volcanoes.items.some((item) => sharedNames.has(item[0]))).toBe(true);
  });

  it("is the same every time", () => {
    expect(build()).toEqual(data);
  });

  it("stops when a category does not have enough items", () => {
    expect(() => build({ lakes: rowsFor(12, 0.000001) })).toThrow(/Only \d+ of \d+ medium lakes/);
  });
});
