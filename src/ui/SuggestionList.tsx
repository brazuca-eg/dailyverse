import { readCountryName } from "../core/countryNames";
import { getFlagEmoji } from "../core/flags";
import type { Country } from "../core/types";
import "./SuggestionList.css";

interface SuggestionListProps {
  listId: string;
  suggestions: readonly Country[];
  highlightedIndex: number;
  onSelect: (country: Country) => void;
  showFlags?: boolean;
}

export function buildOptionId(listId: string, index: number): string {
  return `${listId}-${index}`;
}

export function SuggestionList({
  listId,
  suggestions,
  highlightedIndex,
  onSelect,
  showFlags = true,
}: SuggestionListProps) {
  return (
    <ul id={listId} role="listbox" className="suggestions">
      {suggestions.map((country, index) => (
        <li
          key={country.code}
          id={buildOptionId(listId, index)}
          role="option"
          aria-selected={index === highlightedIndex}
          className={index === highlightedIndex ? "suggestion highlighted" : "suggestion"}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => onSelect(country)}
        >
          {showFlags && (
            <span className="suggestion-flag" aria-hidden="true">
              {getFlagEmoji(country.code)}
            </span>
          )}
          {readCountryName(country)}
        </li>
      ))}
    </ul>
  );
}
