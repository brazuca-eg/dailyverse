import { describe, expect, it } from "vitest";
import type { Country } from "../../src/core/types";
import type { MysteryPlacePuzzle } from "../../src/games/mystery-place/types";
import {
  checkFlagFacts,
  checkMysteryTranslation,
  extractNumberTokens,
  findLeakedNames,
} from "./translations";

const spain: Country = {
  code: "ES",
  name: "Spain",
  aliases: ["Kingdom of Spain"],
  continent: "Europe",
  lat: 40,
  lng: -4,
};

function clue(text: string) {
  return { kind: "geography" as const, text };
}

const puzzle: MysteryPlacePuzzle = {
  id: "mp-1",
  country: "ES",
  difficulty: "easy",
  clues: [
    clue("The Camino de Santiago is a pilgrimage of about 800 km."),
    clue("It has a rich culture with long traditions."),
    clue("Its capital is on a high plateau."),
    clue("The famous running of the bulls takes place in July."),
    clue("A cathedral begun in 1882 is still under construction."),
  ],
  reveal: {
    funFact: "The country has more than 8,000 km of coastline.",
    sourceUrl: "https://example.org",
  },
};

const good = {
  clues: [
    "El Camino de Santiago es una peregrinación de unos 800 km.",
    "Tiene una cultura rica con largas tradiciones.",
    "Su capital está en una meseta alta del interior.",
    "El famoso encierro de toros se celebra en julio.",
    "Una catedral iniciada en 1882 sigue en construcción.",
  ],
  funFact: "El país tiene más de 8.000 km de costa en total.",
};

describe("extractNumberTokens", () => {
  it("reads numbers written with commas, dots or spaces as the same digits", () => {
    expect(extractNumberTokens("8,000 km")).toEqual(["8000"]);
    expect(extractNumberTokens("8.000 km")).toEqual(["8000"]);
    expect(extractNumberTokens("8 000 km")).toEqual(["8000"]);
    expect(extractNumberTokens("8\u00a0000 km")).toEqual(["8000"]);
    expect(extractNumberTokens("in 1988 and 2 islands")).toEqual(["1988", "2"]);
    expect(extractNumberTokens("May 20, 1902")).toEqual(["20", "1902"]);
    expect(extractNumberTokens("el 20 de mayo de 1902")).toEqual(["20", "1902"]);
    expect(extractNumberTokens("1,420 and 12,345,678")).toEqual(["1420", "12345678"]);
    expect(extractNumberTokens("no numbers")).toEqual([]);
  });
});

describe("natural number formats", () => {
  const check = (englishText: string, translated: string) =>
    checkFlagFacts({ XX: { funFact: englishText } }, { XX: { funFact: translated } });

  it("accepts a date in the usual order of the language", () => {
    expect(
      check(
        "It was signed on May 20, 1902 in the capital.",
        "Se firmó el 20 de mayo de 1902 en la capital.",
      ),
    ).toEqual([]);
  });

  it("accepts Roman numerals for a century", () => {
    expect(
      check(
        "It dates from the 14th century and is large.",
        "Se remonta al siglo XIV y es muy grande.",
      ),
    ).toEqual([]);
    expect(
      check(
        "It dates from the 20th-century era and is large.",
        "Se remonta a la era del siglo XX y es grande.",
      ),
    ).toEqual([]);
  });

  it("accepts words for decades and ordinal numbers", () => {
    expect(
      check(
        "It was popular in the 1990s across the whole region.",
        "Fue popular en los años noventa en toda la región.",
      ),
    ).toEqual([]);
    expect(
      check(
        "It marked the 40th anniversary of the founding.",
        "Marcó el cuadragésimo aniversario de la fundación.",
      ),
    ).toEqual([]);
  });

  it("accepts a year range written in short form", () => {
    expect(
      check("It lasted from 1918-1920 in total.", "Duró de 1918-20 en total, sin cambios."),
    ).toEqual([]);
  });

  it("still wants other numbers, even next to a century", () => {
    expect(
      check(
        "In the 9th century, about 800 km were built.",
        "En el siglo IX se construyeron muchos kilómetros.",
      ),
    ).toEqual(["XX fact: the numbers 800 are missing"]);
  });

  it("still wants a year that was dropped from a range", () => {
    expect(
      check("It lasted from 1918-1920 in total.", "Duró unos pocos años en total, sin cambios."),
    ).toEqual(["XX fact: the numbers 1918, 1920 are missing"]);
  });
});

describe("findLeakedNames", () => {
  it("finds the country name in the language of the clue", () => {
    expect(findLeakedNames("Un viaje por España", spain, "es")).toContain("España");
    expect(findLeakedNames("Eine Reise durch Spanien", spain, "de")).toContain("Spanien");
  });

  it("finds a form of the name, such as the adjective", () => {
    expect(findLeakedNames("La paella es un plato español", spain, "es")).not.toEqual([]);
  });

  it("finds the English name too", () => {
    expect(findLeakedNames("Spain is large", spain, "de")).toContain("Spain");
  });

  it("finds nothing in a clean clue", () => {
    expect(findLeakedNames("Su capital está en una meseta alta", spain, "es")).toEqual([]);
  });

  it("ignores accents and capitals", () => {
    expect(findLeakedNames("ESPANA", spain, "es")).not.toEqual([]);
  });
});

describe("checkMysteryTranslation", () => {
  const check = (translations: Record<string, unknown>) =>
    checkMysteryTranslation("es", [puzzle], translations as never, [spain]);

  it("accepts a good translation", () => {
    expect(check({ "mp-1": good })).toEqual([]);
  });

  it("reports a puzzle that was not translated and one that does not exist", () => {
    expect(check({})).toEqual(["mp-1: not translated"]);
    expect(check({ "mp-1": good, "mp-9": good })).toEqual(["mp-9: not a puzzle"]);
  });

  it("wants exactly five clues", () => {
    expect(check({ "mp-1": { ...good, clues: good.clues.slice(1) } })).toEqual([
      "mp-1: needs exactly 5 clues",
    ]);
  });

  it("reports a clue that is empty, or that lost a number", () => {
    const clues = [...good.clues];
    clues[0] = "El Camino de Santiago es una peregrinación larga.";
    clues[1] = "";
    const issues = check({ "mp-1": { ...good, clues } });
    expect(issues).toContain("mp-1 clue 1: the numbers 800 are missing");
    expect(issues).toContain("mp-1 clue 2: missing or too short");
  });

  it("reports a clue that gives away the answer", () => {
    const clues = [...good.clues];
    clues[2] = "La capital de España está en una meseta alta.";
    expect(check({ "mp-1": { ...good, clues } })).toEqual([
      'mp-1 clue 3: gives away the answer ("España")',
    ]);
  });

  it("reports a fun fact without its number", () => {
    expect(check({ "mp-1": { ...good, funFact: "El país tiene una costa muy larga." } })).toEqual([
      "mp-1 fun fact: the numbers 8000 are missing",
    ]);
  });

  it("reports a text that is too long", () => {
    const clues = [...good.clues];
    clues[1] = `${"largo ".repeat(60)}`;
    expect(
      check({ "mp-1": { ...good, clues } }).some((issue) => issue.includes("longer than")),
    ).toBe(true);
  });
});

describe("checkFlagFacts", () => {
  const english = {
    ES: { funFact: "The flag was adopted in 1981." },
    FR: { funFact: "It has three bands." },
  };

  it("accepts a full translation", () => {
    expect(
      checkFlagFacts(english, {
        ES: { funFact: "La bandera fue adoptada en 1981." },
        FR: { funFact: "Tiene tres franjas." },
      }),
    ).toEqual([]);
  });

  it("reports missing, extra, short and number-less facts", () => {
    const issues = checkFlagFacts(english, {
      ES: { funFact: "La bandera es muy antigua." },
      XX: { funFact: "Una bandera inventada." },
    });
    expect(issues).toEqual([
      "FR: not translated",
      "XX: not a flag",
      "ES fact: the numbers 1981 are missing",
    ]);
    expect(
      checkFlagFacts(english, { ES: { funFact: "corto" }, FR: { funFact: "Tiene tres franjas." } }),
    ).toContain("ES fact: missing or too short");
  });
});
