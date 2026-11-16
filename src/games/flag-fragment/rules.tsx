import { MAX_GUESSES } from "../../core/guessing";

export const FLAG_FRAGMENT_RULE_STEPS = [
  `Name the country from a small piece of its flag. You have ${MAX_GUESSES} guesses.`,
  "Each wrong guess zooms out: first a bigger crop, then the blurred flag, then without colour, and finally the full flag.",
  "After a guess, the arrow points from your guess toward the answer, and the bar shows how close you are.",
  "The fewer guesses you use, the more points you earn.",
];
