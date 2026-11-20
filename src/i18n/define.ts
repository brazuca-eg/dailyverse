import { DEFAULT_LOCALE, readCurrentLocale, type Locale } from "./locales";

type PluralCategory = "zero" | "one" | "two" | "few" | "many" | "other";
type Params = Readonly<Record<string, string | number>>;
type Table = Readonly<Record<string, string>>;
type StripPlural<K extends string> = K extends `${infer Base}.${PluralCategory}` ? Base : K;

export type MessageSet<T extends Table> = { en: T } & Record<
  Exclude<Locale, "en">,
  Record<keyof T, string> & Record<string, string>
>;

export interface Translator<T extends Table> {
  (key: StripPlural<Extract<keyof T, string>>, params?: Params): string;
  in: (locale: Locale) => (key: StripPlural<Extract<keyof T, string>>, params?: Params) => string;
  messages: MessageSet<T>;
}

const pluralRules = new Map<Locale, Intl.PluralRules>();

function selectCategory(locale: Locale, count: number): PluralCategory {
  const known = pluralRules.get(locale) ?? new Intl.PluralRules(locale);
  pluralRules.set(locale, known);
  return known.select(count) as PluralCategory;
}

export function interpolate(text: string, params?: Params): string {
  return params
    ? text.replace(/\{(\w+)\}/g, (match, name: string) =>
        name in params ? String(params[name]) : match,
      )
    : text;
}

function lookup(table: Table, key: string, params?: Params, locale?: Locale): string | undefined {
  const count = params?.count;
  if (typeof count === "number" && locale) {
    return table[`${key}.${selectCategory(locale, count)}`] ?? table[`${key}.other`];
  }
  return table[key];
}

export function defineMessages<T extends Table>(messages: MessageSet<T>): Translator<T> {
  const translateIn =
    (locale: Locale) =>
    (key: string, params?: Params): string => {
      const text =
        lookup(messages[locale], key, params, locale) ??
        lookup(messages[DEFAULT_LOCALE], key, params, DEFAULT_LOCALE);
      return interpolate(text ?? key, params);
    };
  const translate = ((key: string, params?: Params) =>
    translateIn(readCurrentLocale())(key, params)) as unknown as Translator<T>;
  translate.in = translateIn as Translator<T>["in"];
  translate.messages = messages;
  return translate;
}
