import { DIFFERENCE_COUNT } from "./difficulty";
import { MAX_LIVES } from "./game";
import { spotMessages as t } from "./messages";

const RULE_COUNT = 6;

export function buildRuleSteps(): string[] {
  return Array.from({ length: RULE_COUNT }, (_, index) =>
    t(`spot.rules.${index + 1}` as "spot.rules.1", {
      total: DIFFERENCE_COUNT,
      lives: MAX_LIVES,
    }),
  );
}
