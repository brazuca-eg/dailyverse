import { readCountryName } from "../core/countryNames";
import type { Country } from "../core/types";
import { uiMessages as t } from "./messages";

interface AnswerSummaryProps {
  answer: Country;
}

const ANSWER_MARKER = "\u0001";

export function AnswerSummary({ answer }: AnswerSummaryProps) {
  const [before, after] = t("ui.result.answer", { answer: ANSWER_MARKER }).split(ANSWER_MARKER);
  return (
    <>
      {before}
      <strong>{readCountryName(answer)}</strong>
      {after}
    </>
  );
}
