import { describe, expect, it } from "vitest";
import {
  buildLocalNames,
  buildNamesQuery,
  findIdsByName,
  mergeLabels,
  parseNameRows,
  pickLocalName,
} from "./names";

function row(id: string, lang: string, label: string) {
  return {
    item: { value: `http://www.wikidata.org/entity/${id}` },
    lang: { value: lang },
    label: { value: label },
  };
}

describe("buildNamesQuery", () => {
  it("asks for the labels of the items in the five languages", () => {
    const query = buildNamesQuery(["Q1", "Q2"]);
    expect(query).toContain("wd:Q1 wd:Q2");
    expect(query).toContain('"es", "fr", "it", "de", "uk"');
  });
});

describe("parseNameRows and mergeLabels", () => {
  it("groups the labels of an item by language", () => {
    const labels = parseNameRows({
      results: {
        bindings: [row("Q1", "es", "Uno"), row("Q1", "de", "Eins"), row("Q2", "es", "Dos")],
      },
    });
    expect(labels.get("Q1")?.get("de")).toBe("Eins");
    expect(labels.get("Q2")?.get("es")).toBe("Dos");
  });

  it("refuses an answer without rows", () => {
    expect(() => parseNameRows({})).toThrow("no results.bindings");
  });

  it("merges the labels of two answers", () => {
    const first = parseNameRows({ results: { bindings: [row("Q1", "es", "Uno")] } });
    const second = parseNameRows({ results: { bindings: [row("Q2", "es", "Dos")] } });
    expect([...mergeLabels(first, second).keys()]).toEqual(["Q1", "Q2"]);
  });
});

describe("findIdsByName", () => {
  it("keeps the first id of a name", () => {
    const ids = findIdsByName([
      { id: "Q1", name: "Alpha", value: 1, links: 1 },
      { id: "Q2", name: "Alpha", value: 2, links: 2 },
      { id: "Q3", name: "Beta", value: 3, links: 3 },
    ]);
    expect(ids.get("Alpha")).toBe("Q1");
    expect(ids.get("Beta")).toBe("Q3");
  });
});

describe("pickLocalName", () => {
  it("accepts a different, usable name", () => {
    expect(pickLocalName("Q1", "Mount Everest", "Monte Everest")).toBe("Monte Everest");
  });

  it("rejects a missing name, the same name, an id or an unusable name", () => {
    expect(pickLocalName("Q1", "Etna", undefined)).toBeNull();
    expect(pickLocalName("Q1", "Etna", "Etna")).toBeNull();
    expect(pickLocalName("Q1", "Etna", "Q1")).toBeNull();
    expect(pickLocalName("Q1", "Etna", "Monte Etna (volcán)")).toBeNull();
    expect(pickLocalName("Q1", "Etna", "x".repeat(60))).toBeNull();
  });
});

describe("buildLocalNames", () => {
  it("maps the English names of each category to the local ones", () => {
    const labels = parseNameRows({
      results: { bindings: [row("Q1", "es", "Monte Everest"), row("Q2", "es", "Nilo")] },
    });
    const names = buildLocalNames(
      {
        mountains: ["Mount Everest", "Unknown"],
        rivers: ["Nile"],
        lakes: [],
        islands: [],
        volcanoes: [],
      },
      {
        mountains: new Map([["Mount Everest", "Q1"]]),
        rivers: new Map([["Nile", "Q2"]]),
        lakes: new Map(),
        islands: new Map(),
        volcanoes: new Map(),
      },
      labels,
      "es",
    );
    expect(names.mountains).toEqual({ "Mount Everest": "Monte Everest" });
    expect(names.rivers).toEqual({ Nile: "Nilo" });
  });
});
