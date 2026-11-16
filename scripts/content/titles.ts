import type { Country } from "../../src/core/types";

const TITLE_EXCEPTIONS: Readonly<Record<string, string>> = {
  GE: "Georgia (country)",
  IE: "Republic of Ireland",
  GM: "The Gambia",
  BS: "The Bahamas",
  PS: "State of Palestine",
  FM: "Federated States of Micronesia",
};

export function getWikipediaTitle(country: Country): string {
  return TITLE_EXCEPTIONS[country.code] ?? country.name;
}
