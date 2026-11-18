import { describe, expect, it } from "vitest";
import { EXTRA_BLOCKED, expandBlocklist, parseScowl, selectAnswerable } from "./filter";

describe("parseScowl", () => {
  const text = "Header line\nCopyright\n---\nTree\ntree\ndon't\nwell-known\nreef\nÜber\n";

  it("reads only what comes after the separator, and drops capitals and punctuation", () => {
    expect(parseScowl(text)).toEqual(["tree", "reef"]);
  });

  it("reads a list with no header", () => {
    expect(parseScowl("tree\nreef\n")).toEqual(["tree", "reef"]);
  });

  it("gives nothing for an empty text", () => {
    expect(parseScowl("")).toEqual([]);
  });
});

describe("expandBlocklist", () => {
  it("blocks the listed words and their simple inflections", () => {
    const blocked = expandBlocklist(["bad"]);
    ["bad", "bads", "baded", "bading", "badder", "badders", "badies"].forEach((word) => {
      expect(blocked.has(word)).toBe(true);
    });
  });

  it("doubles the last letter before an ending that starts with a vowel", () => {
    const blocked = expandBlocklist(["shit"]);
    ["shitted", "shitting", "shitter", "shitty"].forEach((word) =>
      expect(blocked.has(word)).toBe(true),
    );
  });

  it("handles a word that ends in e", () => {
    const blocked = expandBlocklist(["rape"]);
    ["rape", "rapes", "raped", "raping", "raper"].forEach((word) =>
      expect(blocked.has(word)).toBe(true),
    );
  });

  it("ignores entries that are not single words, and normalises case and spaces", () => {
    const blocked = expandBlocklist(["two words", "  LOUD  ", "x-y", "2g1c"]);
    expect(blocked.has("loud")).toBe(true);
    expect(blocked.has("two words")).toBe(false);
    expect(blocked.has("twowords")).toBe(false);
    expect(blocked.has("2g1c")).toBe(false);
  });

  it("always includes the built-in additions, even for an empty list", () => {
    const blocked = expandBlocklist([]);
    EXTRA_BLOCKED.forEach((word) => expect(blocked.has(word)).toBe(true));
  });

  it("blocks the slurs and vulgar words the community list misses", () => {
    const blocked = expandBlocklist([]);
    ["retard", "honky", "pimp", "prick", "ejaculate", "moron", "negroid"].forEach((word) => {
      expect(blocked.has(word)).toBe(true);
    });
  });

  it("does not block ordinary words", () => {
    const blocked = expandBlocklist([]);
    ["trail", "camp", "hike", "damn", "crazy", "nigh"].forEach((word) =>
      expect(blocked.has(word)).toBe(false),
    );
  });
});

describe("selectAnswerable", () => {
  it("keeps only answerable, unblocked, different words", () => {
    const words = ["tree", "tree", "cat", "dinosaur", "bad", "reef"];
    expect(selectAnswerable(words, new Set(["bad"]))).toEqual(["tree", "reef"]);
  });

  it("gives nothing for no words", () => {
    expect(selectAnswerable([], new Set())).toEqual([]);
  });
});
