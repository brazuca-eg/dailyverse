import { sudokuMessages as t } from "./messages";

export function buildRuleSteps(): string[] {
  return [
    t("sudoku.rules.1"),
    t("sudoku.rules.2"),
    t("sudoku.rules.3"),
    t("sudoku.rules.4"),
    t("sudoku.rules.5"),
  ];
}
