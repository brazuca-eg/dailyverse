import { LOCALES, buildLocalePath, splitLocalePath, type Locale } from "../i18n/locales";

export interface SocialMetaInput {
  site: URL;
  pathname: string;
  locale: Locale;
  title: string;
  description: string;
}

export interface MetaTag {
  property?: string;
  name?: string;
  content: string;
}

export interface AlternateLink {
  hreflang: string;
  href: string;
}

const OPEN_GRAPH_LOCALES: Readonly<Record<Locale, string>> = {
  en: "en_US",
  es: "es_ES",
  fr: "fr_FR",
  it: "it_IT",
  de: "de_DE",
  uk: "uk_UA",
};

export const SOCIAL_IMAGE_PATH = "/og-image.png";

export function buildSocialTags({
  site,
  pathname,
  locale,
  title,
  description,
}: SocialMetaInput): MetaTag[] {
  return [
    { property: "og:type", content: "website" },
    { property: "og:site_name", content: "Dailyverse" },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:url", content: new URL(pathname, site).href },
    { property: "og:locale", content: OPEN_GRAPH_LOCALES[locale] },
    { property: "og:image", content: new URL(SOCIAL_IMAGE_PATH, site).href },
    { property: "og:image:width", content: "1200" },
    { property: "og:image:height", content: "630" },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: new URL(SOCIAL_IMAGE_PATH, site).href },
  ];
}

export function buildAlternateLinks(site: URL, pathname: string): AlternateLink[] {
  const { path } = splitLocalePath(pathname);
  return [
    ...LOCALES.map((locale) => ({
      hreflang: locale,
      href: new URL(buildLocalePath(locale, path), site).href,
    })),
    { hreflang: "x-default", href: new URL(buildLocalePath("en", path), site).href },
  ];
}
