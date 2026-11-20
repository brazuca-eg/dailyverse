import { useEffect, useState } from "react";
import {
  DEFAULT_LOCALE,
  LOCALE_LABELS,
  buildLocalePath,
  pickSupportedLocale,
  type Locale,
} from "../i18n/locales";
import { readLocalePreference, saveLocalePreference } from "../i18n/preference";
import { siteMessages } from "../i18n/site";
import "./LanguageSuggestion.css";

export function findSuggestedLocale(
  saved: Locale | null,
  languages: readonly string[],
): Locale | null {
  if (saved !== null) {
    return null;
  }
  const picked = pickSupportedLocale(languages);
  return picked !== null && picked !== DEFAULT_LOCALE ? picked : null;
}

export function findRedirectLocale(saved: Locale | null, pathname: string): Locale | null {
  return saved !== null && saved !== DEFAULT_LOCALE && pathname === "/" ? saved : null;
}

export function LanguageSuggestion() {
  const [saved] = useState(() => readLocalePreference());
  const [suggested, setSuggested] = useState(() =>
    findSuggestedLocale(saved, navigator.languages ?? []),
  );
  const redirectTo = findRedirectLocale(saved, window.location.pathname);

  useEffect(() => {
    if (redirectTo !== null) {
      window.location.replace(buildLocalePath(redirectTo));
    }
  }, [redirectTo]);

  if (suggested === null) {
    return null;
  }
  const say = siteMessages.in(suggested);
  const language = LOCALE_LABELS[suggested];

  return (
    <aside className="suggestion" lang={suggested}>
      <p className="suggestion-text">{say("site.language.suggest", { language })}</p>
      <div className="suggestion-actions">
        <a
          className="button suggestion-button"
          href={buildLocalePath(suggested)}
          onClick={() => saveLocalePreference(suggested)}
        >
          {say("site.language.switch", { language })}
        </a>
        <button
          type="button"
          className="button button-secondary suggestion-button"
          onClick={() => {
            saveLocalePreference(DEFAULT_LOCALE);
            setSuggested(null);
          }}
        >
          {say("site.language.stay")}
        </button>
      </div>
    </aside>
  );
}
