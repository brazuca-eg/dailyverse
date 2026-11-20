import { describe, expect, it } from "vitest";
import { LOCALES } from "./locales";

interface MessageModule {
  messages: Record<string, Record<string, string>>;
}

const PLURAL_SUFFIX = /\.(zero|one|two|few|many|other)$/;
const modules = import.meta.glob<Record<string, unknown>>(
  ["../**/messages.ts", "../games/*/meta.ts", "./site.ts", "./stats.ts"],
  { eager: true },
);

function isMessageModule(value: unknown): value is MessageModule {
  return (
    typeof value === "function" && typeof (value as unknown as MessageModule).messages === "object"
  );
}

const sets = Object.entries(modules).flatMap(([path, exported]) =>
  Object.entries(exported)
    .filter(([, value]) => isMessageModule(value))
    .map(([name, value]) => ({
      id: `${path}#${name}`,
      messages: (value as MessageModule).messages,
    })),
);

function listBases(table: Record<string, string>): string[] {
  return [...new Set(Object.keys(table).map((key) => key.replace(PLURAL_SUFFIX, "")))].sort();
}

function listPlaceholders(text: string): string[] {
  return [...text.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort();
}

describe("message sets", () => {
  it("are found", () => {
    expect(sets.length).toBeGreaterThan(0);
  });

  describe.each(sets)("$id", ({ messages }) => {
    const english = messages.en;

    it("has every language", () => {
      expect(Object.keys(messages).sort()).toEqual([...LOCALES].sort());
    });

    it.each(LOCALES)("%s has the same messages as English", (locale) => {
      expect(listBases(messages[locale])).toEqual(listBases(english));
    });

    it.each(LOCALES)("%s has no empty message", (locale) => {
      Object.entries(messages[locale]).forEach(([key, text]) => {
        expect(text.trim(), `${locale} ${key}`).not.toBe("");
      });
    });

    it.each(LOCALES)("%s uses the same placeholders as English", (locale) => {
      const baseOf = (key: string) => key.replace(PLURAL_SUFFIX, "");
      const englishByBase = new Map<string, string[]>();
      Object.entries(english).forEach(([key, text]) => {
        englishByBase.set(baseOf(key), [
          ...(englishByBase.get(baseOf(key)) ?? []),
          ...listPlaceholders(text),
        ]);
      });
      Object.entries(messages[locale]).forEach(([key, text]) => {
        const expected = [...new Set(englishByBase.get(baseOf(key)))].sort();
        expect([...new Set(listPlaceholders(text))].sort(), `${locale} ${key}`).toEqual(expected);
      });
    });

    it.each(LOCALES)("%s has an other form for every plural", (locale) => {
      const pluralBases = [
        ...new Set(
          Object.keys(english)
            .filter((key) => PLURAL_SUFFIX.test(key))
            .map((key) => key.replace(PLURAL_SUFFIX, "")),
        ),
      ];
      pluralBases.forEach((base) => {
        expect(messages[locale][`${base}.other`], `${locale} ${base}`).toBeDefined();
      });
    });

    it("gives Ukrainian the few and many forms of every plural", () => {
      const pluralBases = [
        ...new Set(
          Object.keys(english)
            .filter((key) => PLURAL_SUFFIX.test(key))
            .map((key) => key.replace(PLURAL_SUFFIX, "")),
        ),
      ];
      pluralBases.forEach((base) => {
        expect(messages.uk[`${base}.few`], base).toBeDefined();
        expect(messages.uk[`${base}.many`], base).toBeDefined();
      });
    });

    it.each(LOCALES.filter((locale) => locale !== "en"))(
      "%s does not leave long English text untranslated",
      (locale) => {
        Object.entries(messages[locale]).forEach(([key, text]) => {
          const letters = (english[key] ?? "").replace(/\{\w+\}/g, "").replace(/[^\p{L}]/gu, "");
          const isLong = letters.length > 30;
          expect(isLong && text === english[key], `${locale} ${key}`).toBe(false);
        });
      },
    );
  });

  it("never reuse a message key in two sets", () => {
    const seen = new Map<string, string>();
    const clashes = sets.flatMap(({ id, messages }) =>
      Object.keys(messages.en).flatMap((key) => {
        const owner = seen.get(key);
        seen.set(key, id);
        return owner ? [`${key} in ${owner} and ${id}`] : [];
      }),
    );
    expect(clashes).toEqual([]);
  });
});
