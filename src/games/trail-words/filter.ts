import { isAnswerable } from "./words";

const SCOWL_SEPARATOR = "\n---\n";
const SUFFIXES = ["s", "es", "ed", "d", "ing", "er", "ers", "y", "ie", "ies", "in"];

export const EXTRA_BLOCKED: readonly string[] = [
  "retard",
  "retards",
  "retarded",
  "tard",
  "fag",
  "fags",
  "faggy",
  "dyke",
  "dykes",
  "chink",
  "chinks",
  "gook",
  "gooks",
  "paki",
  "pakis",
  "redskin",
  "redskins",
  "squaw",
  "spick",
  "spicks",
  "wetbacks",
  "beaner",
  "beaners",
  "raghead",
  "ragheads",
  "towelhead",
  "gimp",
  "gimps",
  "cripple",
  "cripples",
  "crippled",
  "mongoloid",
  "halfbreed",
  "coolie",
  "coolies",
  "japs",
  "gypsy",
  "gypsies",
  "homo",
  "homos",
  "lesbo",
  "shemale",
  "kikes",
  "niggas",
  "niggers",
  "sluts",
  "whores",
  "cunts",
  "twats",
  "wanker",
  "wankers",
  "honky",
  "honkies",
  "kraut",
  "krauts",
  "limey",
  "limeys",
  "mick",
  "micks",
  "negroid",
  "negroes",
  "spaz",
  "spazz",
  "skank",
  "skanks",
  "slag",
  "slags",
  "trollop",
  "trollops",
  "strumpet",
  "strumpets",
  "hussy",
  "hussies",
  "floozy",
  "floozies",
  "bimbo",
  "ejaculate",
  "ejaculates",
  "ejaculated",
  "ejaculating",
  "erection",
  "erections",
  "shag",
  "shags",
  "shagged",
  "shagging",
  "bugger",
  "buggers",
  "buggered",
  "buggering",
  "pimp",
  "pimps",
  "pimped",
  "pimping",
  "prick",
  "pricks",
  "piss",
  "pisses",
  "pissed",
  "pissing",
  "sluttish",
  "molest",
  "molests",
  "molested",
  "molesting",
  "molester",
  "molesters",
  "sodding",
  "turd",
  "turds",
  "mongol",
  "mongols",
  "moron",
  "morons",
  "imbecile",
  "imbeciles",
  "wops",
  "dago",
  "dagos",
  "darky",
  "darkies",
  "sambo",
];

export function parseScowl(text: string): string[] {
  const body = text.includes(SCOWL_SEPARATOR) ? text.split(SCOWL_SEPARATOR)[1] : text;
  return body.split("\n").filter((word) => /^[a-z]+$/.test(word));
}

function listVariants(entry: string): string[] {
  const stem = entry.endsWith("e") ? entry.slice(0, -1) : entry;
  const doubled = `${entry}${entry.slice(-1)}`;
  return [
    entry,
    ...SUFFIXES.flatMap((suffix) => [
      `${entry}${suffix}`,
      `${stem}${suffix}`,
      ...(/^[aeiouy]/.test(suffix) ? [`${doubled}${suffix}`] : []),
    ]),
  ];
}

export function expandBlocklist(entries: readonly string[]): Set<string> {
  return new Set(
    [...entries, ...EXTRA_BLOCKED]
      .map((entry) => entry.trim().toLowerCase())
      .filter((entry) => /^[a-z]+$/.test(entry))
      .flatMap(listVariants),
  );
}

export function selectAnswerable(words: readonly string[], blocked: ReadonlySet<string>): string[] {
  return [...new Set(words)].filter((word) => isAnswerable(word) && !blocked.has(word));
}
