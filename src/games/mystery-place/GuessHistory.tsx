import { getFlagEmoji } from "../../core/flags";
import type { Country } from "../../core/types";
import { CheckIcon } from "../../ui/icons";
import type { GuessRecord } from "./game";
import { GuessRow } from "./GuessRow";
import "./GuessRow.css";

interface GuessHistoryProps {
  guesses: readonly GuessRecord[];
  countries: readonly Country[];
}

export function GuessHistory({ guesses, countries }: GuessHistoryProps) {
  if (guesses.length === 0) {
    return null;
  }
  const namesByCode = new Map(countries.map((country) => [country.code, country.name]));
  return (
    <ol className="guesses card-list" aria-label="Your guesses">
      {guesses.map((guess) => {
        const name = namesByCode.get(guess.countryCode) ?? guess.countryCode;
        if (guess.feedback.isCorrect) {
          return (
            <li key={guess.countryCode} className="guess guess-correct">
              <span className="guess-flag" aria-hidden="true">
                {getFlagEmoji(guess.countryCode)}
              </span>
              <div className="guess-main">
                <span className="guess-name">{name}</span>
                <span className="guess-correct-label">Correct</span>
              </div>
              <span className="guess-badge guess-badge-correct">
                <CheckIcon size={22} />
              </span>
            </li>
          );
        }
        return (
          <li key={guess.countryCode} className="guess">
            <GuessRow
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
