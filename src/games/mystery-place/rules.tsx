import { readCountryName } from "../../core/countryNames";
import { MAX_GUESSES } from "../../core/guessing";
import type { Country } from "../../core/types";
import { GuessRow } from "../../ui/GuessRow";
import { mysteryMessages as t } from "./messages";

const EXAMPLE_COUNTRY: Country = {
  code: "ES",
  name: "Spain",
  aliases: [],
  continent: "Europe",
  lat: 40,
  lng: -4,
};

export function buildRuleSteps(): string[] {
  return [
    t("mystery.rules.1", { max: MAX_GUESSES }),
    t("mystery.rules.2"),
    t("mystery.rules.3"),
    t("mystery.rules.4"),
  ];
}

export function buildRuleExample() {
  return (
    <GuessRow
      countryCode={EXAMPLE_COUNTRY.code}
      name={readCountryName(EXAMPLE_COUNTRY)}
      distanceKm={1420}
      direction="NE"
    />
  );
}
