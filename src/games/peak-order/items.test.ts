import { describe, expect, it } from "vitest";
import {
  cleanItems,
  isUsableName,
  parseBindings,
  parseEditionCounts,
  parseItemIds,
  rankIds,
  removeIds,
  type Binding,
} from "./items";

function binding(id: string, name: string, value: number, links = 50): Binding {
  return { id, name, value, links };
}

function cell(value: string) {
  return { value };
}

describe("parseBindings", () => {
  it("reads id, name, value and sitelinks from a SPARQL answer", () => {
    const json = {
      results: {
        bindings: [
          {
            item: cell("http://www.wikidata.org/entity/Q513"),
            itemLabel: cell("Mount Everest"),
            value: cell("8848.86"),
            links: cell("238"),
          },
        ],
      },
    };
    expect(parseBindings(json)).toEqual([
      { id: "Q513", name: "Mount Everest", value: 8848.86, links: 238 },
    ]);
  });

  it("refuses an answer without results", () => {
    expect(() => parseBindings({})).toThrow("results.bindings");
    expect(() => parseBindings({ results: {} })).toThrow();
  });
});

describe("parseEditionCounts", () => {
  it("maps each id to its count", () => {
    const json = {
      results: {
        bindings: [
          { item: cell("http://www.wikidata.org/entity/Q1"), core: cell("12") },
          { item: cell("http://www.wikidata.org/entity/Q2"), core: cell("7") },
        ],
      },
    };
    expect(parseEditionCounts(json)).toEqual(
      new Map([
        ["Q1", 12],
        ["Q2", 7],
      ]),
    );
  });

  it("refuses an answer without results", () => {
    expect(() => parseEditionCounts({})).toThrow();
  });
});

describe("parseItemIds", () => {
  it("lists the ids", () => {
    const json = { results: { bindings: [{ item: cell("http://www.wikidata.org/entity/Q9") }] } };
    expect(parseItemIds(json)).toEqual(["Q9"]);
  });

  it("refuses an answer without results", () => {
    expect(() => parseItemIds({})).toThrow();
  });
});

describe("isUsableName", () => {
  it("accepts ordinary names, accents and apostrophes", () => {
    ["Mont Blanc", "Île Amsterdam", "Adam's Peak", "Bío Bío River"].forEach((name) =>
      expect(isUsableName("Q1", name)).toBe(true),
    );
  });

  it("rejects a missing label, which Wikidata shows as the id", () => {
    expect(isUsableName("Q39739", "Q39739")).toBe(false);
    expect(isUsableName("Q1", "Q77")).toBe(false);
  });

  it("rejects empty, long, bracketed, numbered and comma names", () => {
    expect(isUsableName("Q1", "")).toBe(false);
    expect(isUsableName("Q1", "x".repeat(41))).toBe(false);
    expect(isUsableName("Q1", "x".repeat(40))).toBe(true);
    expect(isUsableName("Q1", "Odra (river)")).toBe(false);
    expect(isUsableName("Q1", "Peak 5")).toBe(false);
    expect(isUsableName("Q1", "Guallatiri, Chile")).toBe(false);
  });
});

describe("removeIds", () => {
  it("drops the rows of the given ids", () => {
    const rows = [binding("Q1", "A", 1), binding("Q2", "B", 1), binding("Q1", "A", 2)];
    expect(removeIds(rows, new Set(["Q1"])).map((row) => row.id)).toEqual(["Q2"]);
  });
});

describe("rankIds", () => {
  const rows = [
    binding("Q3", "C", 1, 10),
    binding("Q1", "A", 1, 90),
    binding("Q2", "B", 1, 50),
    binding("Q1", "A", 2, 90),
    binding("Q4", "D", 1, 50),
  ];

  it("lists each id once, most sitelinks first, ties by id", () => {
    expect(rankIds(rows, 10)).toEqual(["Q1", "Q2", "Q4", "Q3"]);
  });

  it("keeps only the top ones", () => {
    expect(rankIds(rows, 2)).toEqual(["Q1", "Q2"]);
  });
});

describe("cleanItems", () => {
  const editions = new Map([
    ["Q1", 80],
    ["Q2", 70],
    ["Q3", 60],
    ["Q4", 50],
  ]);

  it("turns rows into items, scaling and rounding the value", () => {
    const rows = [binding("Q1", "Lake A", 123456789)];
    expect(cleanItems(rows, editions, 0.000001, 50)).toEqual([
      { name: "Lake A", value: 123, editions: 80 },
    ]);
  });

  it("takes the middle value when sources agree within one percent", () => {
    const rows = [
      binding("Q1", "Peak A", 1000),
      binding("Q1", "Peak A", 1004),
      binding("Q1", "Peak A", 1010),
    ];
    expect(cleanItems(rows, editions, 1, 1)[0].value).toBe(1004);
  });

  it("averages the two middle values of an even count", () => {
    const rows = [binding("Q1", "Peak A", 1000), binding("Q1", "Peak A", 1005)];
    expect(cleanItems(rows, editions, 1, 1)[0].value).toBe(1003);
  });

  it("drops an item whose sources disagree by more than one percent", () => {
    const rows = [binding("Q1", "Peak A", 1000), binding("Q1", "Peak A", 1011)];
    expect(cleanItems(rows, editions, 1, 1)).toEqual([]);
    expect(
      cleanItems([binding("Q1", "Peak A", 1000), binding("Q1", "Peak A", 1010)], editions, 1, 1),
    ).toHaveLength(1);
  });

  it("drops an item with a missing or invalid value", () => {
    expect(cleanItems([binding("Q1", "Peak A", Number.NaN)], editions, 1, 1)).toEqual([]);
    expect(cleanItems([binding("Q1", "Peak A", 0)], editions, 1, 1)).toEqual([]);
    expect(cleanItems([binding("Q1", "Peak A", -5)], editions, 1, 1)).toEqual([]);
    expect(
      cleanItems(
        [binding("Q1", "Peak A", 1000), binding("Q1", "Peak A", Number.NaN)],
        editions,
        1,
        1,
      ),
    ).toEqual([]);
  });

  it("drops an item without an edition count", () => {
    expect(cleanItems([binding("Q9", "Peak Z", 1000)], editions, 1, 1)).toEqual([]);
  });

  it("drops an item without a usable name", () => {
    expect(cleanItems([binding("Q1", "Q1", 1000)], editions, 1, 1)).toEqual([]);
    expect(cleanItems([binding("Q1", "Peak 5", 1000)], editions, 1, 1)).toEqual([]);
  });

  it("drops an item below the smallest value, which is allowed exactly", () => {
    expect(cleanItems([binding("Q1", "Peak A", 299)], editions, 1, 300)).toEqual([]);
    expect(cleanItems([binding("Q1", "Peak A", 300)], editions, 1, 300)).toHaveLength(1);
  });

  it("drops both items when two share a name, so a name is never ambiguous", () => {
    const rows = [
      binding("Q1", "Peak A", 1000),
      binding("Q2", "Peak A", 2000),
      binding("Q3", "Peak B", 3000),
    ];
    expect(cleanItems(rows, editions, 1, 1).map((item) => item.name)).toEqual(["Peak B"]);
  });
});
