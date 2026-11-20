import type { Locale } from "../i18n/locales";
import { gameMeta as bearMeta } from "../games/bear-sweeper/meta";
import { gameMeta as flagMeta } from "../games/flag-fragment/meta";
import { gameMeta as mysteryMeta } from "../games/mystery-place/meta";
import { gameMeta as peakMeta } from "../games/peak-order/meta";
import { gameMeta as spotMeta } from "../games/spot-difference/meta";
import { gameMeta as switchbackMeta } from "../games/switchback/meta";
import { gameMeta as tentsMeta } from "../games/tents-trees/meta";
import { gameMeta as sudokuMeta } from "../games/trail-sudoku/meta";
import { gameMeta as wordsMeta } from "../games/trail-words/meta";
import { gameMeta as weatherMeta } from "../games/weather-window/meta";
import { GAME_GROUPS, type GameGroup } from "./groups";

type MetaKind = "title" | "tagline" | "lead" | "description";

export interface SiteGame {
  slug: string;
  storageId: string;
  readMeta: (locale: Locale, kind: MetaKind) => string;
}

function bind(prefix: string, meta: { in: (locale: Locale) => (key: never) => string }) {
  return (locale: Locale, kind: MetaKind): string =>
    meta.in(locale)(`meta.${prefix}.${kind}` as never);
}

export const SITE_GAMES: readonly SiteGame[] = [
  { slug: "mystery-place", storageId: "mystery-place", readMeta: bind("mystery", mysteryMeta) },
  { slug: "flag-fragment", storageId: "flag-fragment", readMeta: bind("flag", flagMeta) },
  { slug: "peak-order", storageId: "peak-order", readMeta: bind("peak", peakMeta) },
  { slug: "trail-words", storageId: "trail-words", readMeta: bind("words", wordsMeta) },
  { slug: "trail-sudoku", storageId: "trail-sudoku", readMeta: bind("sudoku", sudokuMeta) },
  { slug: "tents-and-trees", storageId: "tents-trees", readMeta: bind("tents", tentsMeta) },
  { slug: "switchback", storageId: "switchback", readMeta: bind("switch", switchbackMeta) },
  { slug: "bear-sweeper", storageId: "bear-sweeper", readMeta: bind("bear", bearMeta) },
  { slug: "spot-the-difference", storageId: "spot-difference", readMeta: bind("spot", spotMeta) },
  { slug: "weather-window", storageId: "weather-window", readMeta: bind("weather", weatherMeta) },
];

export function getSiteGame(slug: string): SiteGame {
  const game = SITE_GAMES.find((candidate) => candidate.slug === slug);
  if (!game) {
    throw new Error(`There is no game ${slug}`);
  }
  return game;
}

export function listGroupGames(group: GameGroup): SiteGame[] {
  return group.slugs.map(getSiteGame);
}

export function listGameGroups(): readonly GameGroup[] {
  return GAME_GROUPS;
}
