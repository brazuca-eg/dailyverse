import { MAX_GUESSES } from "../../core/guessing";
import { GuessRow } from "../../ui/GuessRow";

export const MYSTERY_PLACE_RULE_STEPS = [
  `Find the mystery country. You have ${MAX_GUESSES} guesses.`,
  "Each wrong guess unlocks another clue.",
  "After a guess, the arrow points from your guess toward the answer, and the bar shows how close you are.",
  "The fewer guesses you use, the more points you earn.",
];

export const MYSTERY_PLACE_RULE_EXAMPLE = (
  <GuessRow countryCode="ES" name="Spain" distanceKm={1420} direction="NE" />
);
