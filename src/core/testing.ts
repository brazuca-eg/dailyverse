import { countries } from "./countries";
import type { GuessFeedback, IncorrectFeedback } from "./distance";
import { findCountryByCode } from "./search";
import type { KeyValueStore } from "./storage";
import type { Country } from "./types";

export function createMemoryStore(initial: Record<string, string> = {}): KeyValueStore {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      data.set(key, value);
    },
  };
}

export function requireIncorrect(feedback: GuessFeedback): IncorrectFeedback {
  if (feedback.isCorrect) {
    throw new Error("Expected feedback for an incorrect guess");
  }
  return feedback;
}

export function requireCountry(code: string): Country {
  const country = findCountryByCode(countries, code);
  if (!country) {
    throw new Error(`Unknown country code ${code}`);
  }
  return country;
}
