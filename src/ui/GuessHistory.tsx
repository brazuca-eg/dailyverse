import { readCountryName } from "../core/countryNames";
import { getFlagEmoji } from "../core/flags";
import type { Country } from "../core/types";
import { CheckIcon } from "./icons";
import type { GuessRecord } from "../core/guessing";
import { GuessRow } from "./GuessRow";
import { uiMessages as t } from "./messages";
import "./GuessRow.css";

interface GuessHistoryProps {
  guesses: readonly GuessRecord[];
  countries: readonly Country[];
  showFlags?: boolean;
}

export function GuessHistory({ guesses, countries, showFlags = true }: GuessHistoryProps) {
  if (guesses.length === 0) {
    return null;
  }
  const flagClass = showFlags ? "" : " guess-no-flag";
  const namesByCode = new Map(countries.map((country) => [country.code, readCountryName(country)]));
  return (
    <ol className="guesses card-list" aria-label={t("ui.history.label")}>
      {guesses.map((guess) => {
        const name = namesByCode.get(guess.countryCode) ?? guess.countryCode;
        if (guess.feedback.isCorrect) {
          return (
            <li key={guess.countryCode} className={`guess guess-correct${flagClass}`}>
              {showFlags && (
                <span className="guess-flag" aria-hidden="true">
                  {getFlagEmoji(guess.countryCode)}
                </span>
              )}
              <div className="guess-main">
                <span className="guess-name">{name}</span>
                <span className="guess-correct-label">{t("ui.history.correct")}</span>
              </div>
              <span className="guess-badge guess-badge-correct">
                <CheckIcon size={22} />
              </span>
            </li>
          );
        }
        return (
          <li key={guess.countryCode} className={`guess${flagClass}`}>
            <GuessRow
              showFlag={showFlags}
              countryCode={guess.countryCode}
              name={name}
              distanceKm={guess.feedback.distanceKm}
              direction={guess.feedback.direction}
            />
          </li>
        );
      })}
    </ol>
  );
}
