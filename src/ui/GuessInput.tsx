import { useId, useRef, useState, type KeyboardEvent, type SubmitEvent } from "react";
import { readCountryName } from "../core/countryNames";
import { isTouchDevice } from "../core/device";
import { findCountryByName, searchCountries } from "../core/search";
import type { Country } from "../core/types";
import { SearchIcon } from "./icons";
import { uiMessages as t } from "./messages";
import { buildOptionId, SuggestionList } from "./SuggestionList";
import "./GuessInput.css";

const KEYBOARD_DELAY_MS = 300;

interface GuessInputProps {
  countries: readonly Country[];
  excludedCodes: readonly string[];
  onSubmitGuess: (country: Country) => void;
  showFlags?: boolean;
}

export function GuessInput({
  countries,
  excludedCodes,
  onSubmitGuess,
  showFlags = true,
}: GuessInputProps) {
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
    setQuery(readCountryName(country));
    setError(null);
  }

  function findTypedCountry(): Country | null {
    return selected ?? findCountryByName(countries, query);
  }

  function trySubmit() {
    const target = findTypedCountry();
    if (!target) {
      setError(query.trim() === "" ? t("ui.input.error.empty") : t("ui.input.error.unknown"));
    } else if (excludedCodes.includes(target.code)) {
      setError(t("ui.input.error.duplicate"));
    } else {
      onSubmitGuess(target);
      updateQuery("");
      if (isTouchDevice()) {
        inputRef.current?.blur();
      } else {
        inputRef.current?.focus();
      }
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

  function handleFocus() {
    if (isTouchDevice()) {
      window.setTimeout(
        () => inputRef.current?.scrollIntoView({ block: "center" }),
        KEYBOARD_DELAY_MS,
      );
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
            aria-label={t("ui.input.label")}
            aria-expanded={isOpen}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={isOpen ? buildOptionId(listId, highlightedIndex) : undefined}
            aria-invalid={error !== null}
            aria-describedby={error ? errorId : undefined}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="words"
            enterKeyHint="go"
            spellCheck={false}
            placeholder={t("ui.input.placeholder")}
            value={query}
            onChange={(event) => updateQuery(event.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
          />
          {isOpen && (
            <SuggestionList
              listId={listId}
              suggestions={suggestions}
              highlightedIndex={highlightedIndex}
              onSelect={selectCountry}
              showFlags={showFlags}
            />
          )}
        </div>
        <button type="submit" className="button button-primary">
          {t("ui.input.submit")}
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
