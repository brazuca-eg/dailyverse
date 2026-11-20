export const LOCALES = ["en", "es", "fr", "it", "de", "uk"] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

export const LOCALE_LABELS: Readonly<Record<Locale, string>> = {
  en: "English",
  es: "Español",
  fr: "Français",
  it: "Italiano",
  de: "Deutsch",
  uk: "Українська",
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

export function readCurrentLocale(): Locale {
  if (typeof document === "undefined") {
    return DEFAULT_LOCALE;
  }
  const lang = document.documentElement.lang;
  return isLocale(lang) ? lang : DEFAULT_LOCALE;
}

export function buildLocalePath(locale: Locale, path = ""): string {
  const clean = path.replace(/^\/+|\/+$/g, "");
  const prefix = locale === DEFAULT_LOCALE ? "" : locale;
  return `/${[prefix, clean].filter(Boolean).join("/")}${prefix || clean ? "/" : ""}`;
}

export function splitLocalePath(pathname: string): { locale: Locale; path: string } {
  const [first, ...rest] = pathname.split("/").filter(Boolean);
  const hasLocale = isLocale(first) && first !== DEFAULT_LOCALE;
  const parts = hasLocale ? rest : [first, ...rest].filter(Boolean);
  return { locale: hasLocale ? first : DEFAULT_LOCALE, path: parts.join("/") };
}

export function pickSupportedLocale(languages: readonly string[]): Locale | null {
  const match = languages
    .map((language) => language.toLowerCase().split("-")[0])
    .find((base) => isLocale(base));
  return isLocale(match) ? match : null;
}
