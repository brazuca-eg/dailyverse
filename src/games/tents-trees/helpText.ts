import { tentsMessages } from "./messages";

const RULE_COUNT = 6;

export function buildRuleSteps(): string[] {
  return Array.from({ length: RULE_COUNT }, (_, index) =>
    tentsMessages(`tents.rules.${index + 1}` as "tents.rules.1"),
  );
}
