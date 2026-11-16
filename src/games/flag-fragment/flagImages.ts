const flagUrls = import.meta.glob<string>("/node_modules/flag-icons/flags/4x3/*.svg", {
  eager: true,
  query: "?url",
  import: "default",
});

export function findFlagUrl(code: string): string | null {
  const suffix = `/${code.toLowerCase()}.svg`;
  const path = Object.keys(flagUrls).find((candidate) => candidate.endsWith(suffix));
  return path ? flagUrls[path] : null;
}
