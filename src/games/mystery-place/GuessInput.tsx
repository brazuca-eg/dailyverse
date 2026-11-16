import { useId, useRef, useState, type KeyboardEvent, type SubmitEvent } from "react";
import { findCountryByName, searchCountries } from "../../core/search";
import type { Country } from "../../core/types";
import { SearchIcon } from "../../ui/icons";
import { buildOptionId, SuggestionList } from "./SuggestionList";
import "./GuessInput.css";

interface GuessInputProps {
  countries: readonly Country[];
  excludedCodes: readonly string[];
  onSubmitGuess: (country: Country) => void;
}

const ERROR_MESSAGES = {
  empty: "Type a country to guess.",
  unknown: "Pick a country from the list.",
  duplicate: "You already guessed that one.",
} as const;

export function GuessInput({ countries, excludedCodes, onSubmitGuess }: GuessInputProps) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Country | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();
  const errorId = useId();

  const suggestions = selected ? [] : searchCountries(countries, query, excludedCodes);
  const isOpen = suggestions.length > 0;

  function updateQuery(value: string) {
    setQuery(value);
    setSelected(null);
    setHighlightedIndex(0);
    setError(null);
  }

  function selectCountry(country: Country) {
    setSelected(country);
    setQuery(country.name);
    setError(null);
  }

  function findTypedCountry(): Country | null {
    return selected ?? findCountryByName(countries, query);
  }

  function trySubmit() {
    const target = findTypedCountry();
    if (!target) {
      setError(query.trim() === "" ? ERROR_MESSAGES.empty : ERROR_MESSAGES.unknown);
    } else if (excludedCodes.includes(target.code)) {
      setError(ERROR_MESSAGES.duplicate);
    } else {
      onSubmitGuess(target);
      updateQuery("");
      inputRef.current?.focus();
    }
  }

  function moveHighlight(step: number) {
    setHighlightedIndex((highlightedIndex + step + suggestions.length) % suggestions.length);
  }

  function handleEnter() {
    const highlighted = suggestions[highlightedIndex];
    if (!findTypedCountry() && highlighted) {
      selectCountry(highlighted);
    } else {
      trySubmit();
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown" && isOpen) {
      event.preventDefault();
      moveHighlight(1);
    } else if (event.key === "ArrowUp" && isOpen) {
      event.preventDefault();
      moveHighlight(-1);
    } else if (event.key === "Enter") {
      event.preventDefault();
      handleEnter();
    } else if (event.key === "Escape") {
      updateQuery("");
    }
  }

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    trySubmit();
  }

  return (
    <form className="guess-form" onSubmit={handleSubmit} noValidate>
      <div className="guess-row">
        <div className="combobox">
          <SearchIcon className="combobox-icon" size={20} />
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-label="Guess a country"
            aria-expanded={isOpen}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={isOpen ? buildOptionId(listId, highlightedIndex) : undefined}
            aria-invalid={error !== null}
            aria-describedby={error ? errorId : undefined}
            autoComplete="off"
            autoCapitalize="words"
            enterKeyHint="go"
            spellCheck={false}
            placeholder="Type a country"
            value={query}
            onChange={(event) => updateQuery(event.target.value)}
            onKeyDown={handleKeyDown}
          />
          {isOpen && (
            <SuggestionList
              listId={listId}
              suggestions={suggestions}
              highlightedIndex={highlightedIndex}
              onSelect={selectCountry}
            />
          )}
        </div>
        <button type="submit" className="button button-primary">
          Guess
        </button>
      </div>
      {error && (
        <p id={errorId} className="form-error" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
