import { afterEach, describe, expect, it } from "vitest";
import { defineMessages, interpolate } from "./define";
import {
  buildLocalePath,
  isLocale,
  LOCALES,
  pickSupportedLocale,
  splitLocalePath,
} from "./locales";

const t = defineMessages({
  en: {
    hello: "Hello {name}",
    "item.one": "{count} item",
    "item.other": "{count} items",
    only: "Only English",
  },
  es: {
    hello: "Hola {name}",
    "item.one": "{count} cosa",
    "item.other": "{count} cosas",
    only: "Solo en español",
  },
  fr: {
    hello: "Bonjour {name}",
    "item.one": "{count} chose",
    "item.other": "{count} choses",
    only: "Français",
  },
  it: {
    hello: "Ciao {name}",
    "item.one": "{count} cosa",
    "item.other": "{count} cose",
    only: "Italiano",
  },
  de: {
    hello: "Hallo {name}",
    "item.one": "{count} Ding",
    "item.other": "{count} Dinge",
    only: "Deutsch",
  },
  uk: {
    hello: "Привіт, {name}",
    "item.one": "{count} річ",
    "item.few": "{count} речі",
    "item.many": "{count} речей",
    "item.other": "{count} речі",
    only: "Українська",
  },
});

afterEach(() => {
  document.documentElement.lang = "";
});

describe("interpolate", () => {
  it("fills named placeholders and leaves unknown ones alone", () => {
    expect(interpolate("{a} and {b}", { a: 1 })).toBe("1 and {b}");
    expect(interpolate("plain")).toBe("plain");
    expect(interpolate("{a}{a}", { a: "x" })).toBe("xx");
  });
});

describe("defineMessages", () => {
  it("uses English when the page has no known language", () => {
    expect(t("hello", { name: "Ann" })).toBe("Hello Ann");
    document.documentElement.lang = "xx";
    expect(t("hello", { name: "Ann" })).toBe("Hello Ann");
  });

  it("follows the language of the page", () => {
    document.documentElement.lang = "de";
    expect(t("hello", { name: "Ann" })).toBe("Hallo Ann");
    document.documentElement.lang = "uk";
    expect(t("hello", { name: "Ann" })).toBe("Привіт, Ann");
  });

  it("translates into an explicit language", () => {
    expect(t.in("fr")("hello", { name: "Ann" })).toBe("Bonjour Ann");
    expect(t.in("es")("only")).toBe("Solo en español");
  });

  it("picks the plural form of the language", () => {
    expect(t.in("en")("item", { count: 1 })).toBe("1 item");
    expect(t.in("en")("item", { count: 0 })).toBe("0 items");
    expect(t.in("en")("item", { count: 5 })).toBe("5 items");
    expect(t.in("uk")("item", { count: 1 })).toBe("1 річ");
    expect(t.in("uk")("item", { count: 2 })).toBe("2 речі");
    expect(t.in("uk")("item", { count: 5 })).toBe("5 речей");
    expect(t.in("uk")("item", { count: 21 })).toBe("21 річ");
  });

  it("falls back to the other form when the language has no form for the count", () => {
    expect(t.in("es")("item", { count: 1000000 })).toBe("1000000 cosas");
  });

  it("returns the key for a message that does not exist", () => {
    const missing = t as unknown as (key: string) => string;
    expect(missing("nothing")).toBe("nothing");
  });

  it("exposes the messages it was made from", () => {
    expect(Object.keys(t.messages)).toEqual([...LOCALES]);
  });
});

describe("locale paths", () => {
  it("recognises the supported languages only", () => {
    expect(isLocale("es")).toBe(true);
    expect(isLocale("pt")).toBe(false);
    expect(isLocale(undefined)).toBe(false);
  });

  it("builds paths without a prefix for English", () => {
    expect(buildLocalePath("en")).toBe("/");
    expect(buildLocalePath("en", "trail-sudoku")).toBe("/trail-sudoku/");
    expect(buildLocalePath("es")).toBe("/es/");
    expect(buildLocalePath("uk", "/trail-sudoku/")).toBe("/uk/trail-sudoku/");
  });

  it("splits a path into language and page", () => {
    expect(splitLocalePath("/")).toEqual({ locale: "en", path: "" });
    expect(splitLocalePath("/trail-sudoku")).toEqual({ locale: "en", path: "trail-sudoku" });
    expect(splitLocalePath("/de/trail-sudoku/")).toEqual({ locale: "de", path: "trail-sudoku" });
    expect(splitLocalePath("/fr")).toEqual({ locale: "fr", path: "" });
    expect(splitLocalePath("/en/trail-sudoku")).toEqual({ locale: "en", path: "en/trail-sudoku" });
  });

  it("picks the first supported browser language", () => {
    expect(pickSupportedLocale(["pt-BR", "de-AT", "en"])).toBe("de");
    expect(pickSupportedLocale(["UK"])).toBe("uk");
    expect(pickSupportedLocale(["ja", "pt"])).toBeNull();
    expect(pickSupportedLocale([])).toBeNull();
  });
});
