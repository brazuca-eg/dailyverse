import {
  LOCALES,
  LOCALE_LABELS,
  buildLocalePath,
  readCurrentLocale,
  splitLocalePath,
} from "../i18n/locales";
import { saveLocalePreference } from "../i18n/preference";
import { siteMessages } from "../i18n/site";

export function LanguagePicker() {
  const current = readCurrentLocale();
  const { path } = splitLocalePath(window.location.pathname);
  return (
    <section className="menu-section">
      <h3 className="menu-heading">{siteMessages("site.settings.language")}</h3>
      <ul className="menu-languages">
        {LOCALES.map((locale) => (
          <li key={locale}>
            <a
              className="menu-language"
              href={buildLocalePath(locale, path)}
              lang={locale}
              hrefLang={locale}
              aria-label={LOCALE_LABELS[locale]}
              title={LOCALE_LABELS[locale]}
              aria-current={locale === current ? "true" : undefined}
              onClick={() => saveLocalePreference(locale)}
            >
              <span aria-hidden="true">{locale.toUpperCase()}</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
