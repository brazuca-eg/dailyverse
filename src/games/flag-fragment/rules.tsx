import { MAX_GUESSES } from "../../core/guessing";
import { flagMessages as t } from "./messages";

export function buildRuleSteps(): string[] {
  return [
    t("flag.rules.1", { max: MAX_GUESSES }),
    t("flag.rules.2"),
    t("flag.rules.3"),
    t("flag.rules.4"),
  ];
}
